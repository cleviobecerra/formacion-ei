-- Formación EI: solicitudes, cotizaciones, OC y aislamiento por rol.

create schema if not exists private;

create type public.app_role as enum (
  'solicitante',
  'formacion_general',
  'formacion_privado',
  'presupuesto',
  'admin'
);

create type public.formation_role as enum ('general', 'privado');

create type public.request_status as enum (
  'borrador',
  'en_revision',
  'observada',
  'en_cotizacion',
  'pendiente_presupuesto',
  'aprobada',
  'oc_registrada',
  'cerrada',
  'rechazada'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  area text,
  app_role public.app_role not null default 'solicitante',
  active boolean not null default true,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_app_role_idx on public.profiles (app_role);
create index profiles_email_idx on public.profiles (lower(email));
create index profiles_name_idx on public.profiles (full_name);

create table public.app_settings (
  id int primary key default 1 check (id = 1),
  approval_threshold numeric(14, 2) not null default 1000000,
  currency text not null default 'CLP',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.app_settings (id) values (1);

create table public.folio_counters (
  year int primary key,
  last_value int not null default 0
);

create table public.training_requests (
  id uuid primary key default gen_random_uuid(),
  folio text unique,
  formation_role public.formation_role not null,
  status public.request_status not null default 'borrador',
  title text not null,
  justification text not null,
  training_type text,
  suggested_provider text,
  start_date date,
  end_date date,
  participants_count int not null default 1 check (participants_count > 0),
  participants_detail text,
  estimated_amount numeric(14, 2),
  requester_id uuid not null references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  rejected_reason text,
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_requests_role_status_idx
  on public.training_requests (formation_role, status, created_at desc);
create index training_requests_requester_idx
  on public.training_requests (requester_id, created_at desc);
create index training_requests_status_idx
  on public.training_requests (status, created_at desc);
create index training_requests_folio_idx
  on public.training_requests (folio);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.training_requests (id) on delete cascade,
  vendor_name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'CLP',
  valid_until date,
  file_path text,
  notes text,
  is_selected boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index quotes_request_idx on public.quotes (request_id);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.training_requests (id) on delete cascade,
  quote_id uuid references public.quotes (id),
  erp_oc_number text not null,
  vendor_name text not null,
  amount numeric(14, 2) not null,
  issued_on date not null,
  file_path text,
  notes text,
  registered_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create unique index purchase_orders_erp_idx on public.purchase_orders (erp_oc_number);

create table public.request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.training_requests (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  from_status public.request_status,
  to_status public.request_status,
  comment text,
  created_at timestamptz not null default now()
);

create index request_events_request_idx
  on public.request_events (request_id, created_at);

create or replace function private.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.app_role
  from public.profiles p
  where p.id = auth.uid()
    and p.active;
$$;

create or replace function private.can_see_request(r public.training_requests)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when private.current_role() is null then false
    when private.current_role() = 'admin' then true
    when r.requester_id = auth.uid() or r.created_by = auth.uid() then true
    when private.current_role() = 'formacion_general' and r.formation_role = 'general' then true
    when private.current_role() = 'formacion_privado' and r.formation_role = 'privado' then true
    when private.current_role() = 'presupuesto'
      and r.status in (
        'pendiente_presupuesto',
        'aprobada',
        'oc_registrada',
        'cerrada',
        'rechazada'
      ) then true
    else false
  end;
$$;

create or replace function private.next_folio()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from timezone('America/Santiago', now()))::int;
  n int;
begin
  insert into public.folio_counters (year, last_value)
  values (y, 1)
  on conflict (year) do update
    set last_value = folio_counters.last_value + 1
  returning last_value into n;

  return 'FOR-' || y::text || '-' || lpad(n::text, 5, '0');
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, app_role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'usuario'), '@', 1)
    ),
    'solicitante'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger training_requests_updated_at
  before update on public.training_requests
  for each row execute function private.set_updated_at();

create or replace function private.assign_folio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.folio is null and new.status is distinct from 'borrador' then
    new.folio := private.next_folio();
  end if;
  return new;
end;
$$;

create trigger training_requests_folio
  before insert or update on public.training_requests
  for each row execute function private.assign_folio();

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.app_role;
begin
  select p.app_role into actor_role
  from public.profiles p
  where p.id = auth.uid();

  if new.app_role is distinct from old.app_role
     and actor_role is distinct from 'admin' then
    raise exception 'Solo un administrador puede cambiar el rol';
  end if;

  if new.active is distinct from old.active
     and actor_role is distinct from 'admin' then
    raise exception 'Solo un administrador puede activar o desactivar usuarios';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function private.protect_profile_role();

create or replace function private.log_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_events (request_id, actor_id, from_status, to_status, comment)
    values (new.id, auth.uid(), null, new.status, 'Solicitud creada');
  elsif new.status is distinct from old.status then
    insert into public.request_events (request_id, actor_id, from_status, to_status, comment)
    values (
      new.id,
      auth.uid(),
      old.status,
      new.status,
      coalesce(new.observation, new.rejected_reason)
    );
  end if;
  return new;
end;
$$;

create trigger training_requests_log
  after insert or update of status on public.training_requests
  for each row execute function private.log_request_status_change();

revoke all on schema private from public;
grant usage on schema private to authenticated;

revoke all on function private.current_profile() from public;
revoke all on function private.current_role() from public;
revoke all on function private.can_see_request(public.training_requests) from public;

grant execute on function private.current_profile() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.can_see_request(public.training_requests) to authenticated;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.folio_counters enable row level security;
alter table public.training_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.request_events enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or private.current_role() in (
      'formacion_general',
      'formacion_privado',
      'presupuesto',
      'admin'
    )
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (
    id = auth.uid()
    or private.current_role() = 'admin'
  )
  with check (
    id = auth.uid()
    or private.current_role() = 'admin'
  );

create policy settings_select on public.app_settings
  for select to authenticated
  using (true);

create policy settings_update on public.app_settings
  for update to authenticated
  using (private.current_role() = 'admin')
  with check (private.current_role() = 'admin');

create policy requests_select on public.training_requests
  for select to authenticated
  using (private.can_see_request(training_requests));

create policy requests_insert on public.training_requests
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      requester_id = auth.uid()
      or private.current_role() in (
        'formacion_general',
        'formacion_privado',
        'admin'
      )
    )
  );

create policy requests_update on public.training_requests
  for update to authenticated
  using (private.can_see_request(training_requests))
  with check (private.can_see_request(training_requests));

create policy quotes_select on public.quotes
  for select to authenticated
  using (
    exists (
      select 1
      from public.training_requests r
      where r.id = quotes.request_id
        and private.can_see_request(r)
    )
  );

create policy quotes_insert on public.quotes
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id = quotes.request_id
        and private.can_see_request(r)
    )
  );

create policy quotes_update on public.quotes
  for update to authenticated
  using (
    private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id = quotes.request_id
        and private.can_see_request(r)
    )
  )
  with check (
    private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id = quotes.request_id
        and private.can_see_request(r)
    )
  );

create policy quotes_delete on public.quotes
  for delete to authenticated
  using (
    private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id = quotes.request_id
        and private.can_see_request(r)
    )
  );

create policy purchase_orders_select on public.purchase_orders
  for select to authenticated
  using (
    exists (
      select 1
      from public.training_requests r
      where r.id = purchase_orders.request_id
        and private.can_see_request(r)
    )
  );

create policy purchase_orders_insert on public.purchase_orders
  for insert to authenticated
  with check (
    registered_by = auth.uid()
    and private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id = purchase_orders.request_id
        and private.can_see_request(r)
    )
  );

create policy request_events_select on public.request_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.training_requests r
      where r.id = request_events.request_id
        and private.can_see_request(r)
    )
  );

create policy request_events_insert on public.request_events
  for insert to authenticated
  with check (
    actor_id = auth.uid()
    and exists (
      select 1
      from public.training_requests r
      where r.id = request_events.request_id
        and private.can_see_request(r)
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'quotes',
    'quotes',
    false,
    10485760,
    array['application/pdf']::text[]
  ),
  (
    'oc-docs',
    'oc-docs',
    false,
    10485760,
    array['application/pdf', 'image/png', 'image/jpeg']::text[]
  )
on conflict (id) do nothing;

create policy storage_quotes_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'quotes'
    and exists (
      select 1
      from public.training_requests r
      where r.id::text = (storage.foldername(name))[1]
        and private.can_see_request(r)
    )
  );

create policy storage_quotes_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'quotes'
    and private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id::text = (storage.foldername(name))[1]
        and private.can_see_request(r)
    )
  );

create policy storage_oc_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'oc-docs'
    and exists (
      select 1
      from public.training_requests r
      where r.id::text = (storage.foldername(name))[1]
        and private.can_see_request(r)
    )
  );

create policy storage_oc_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'oc-docs'
    and private.current_role() in ('formacion_general', 'formacion_privado', 'admin')
    and exists (
      select 1
      from public.training_requests r
      where r.id::text = (storage.foldername(name))[1]
        and private.can_see_request(r)
    )
  );
