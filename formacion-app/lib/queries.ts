import { createClient } from "@/lib/supabase/server";
import { inboxStatuses, managedFormationRole } from "@/lib/labels";
import type {
  AppRole,
  AppSettings,
  Profile,
  PurchaseOrder,
  Quote,
  RequestEvent,
  RequestStatus,
  TrainingRequest,
  TrainingRequestWithPeople,
} from "@/lib/types";

const PAGE_SIZE = 20;

const PEOPLE_SELECT = `
  *,
  requester:profiles!requester_id (id, full_name, email, area),
  creator:profiles!created_by (id, full_name, email)
`;

export async function listRequests(options: {
  profile: Profile;
  inbox?: boolean;
  q?: string;
  status?: string;
  page?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("training_requests")
    .select(PEOPLE_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const managed = managedFormationRole(options.profile.app_role);
  if (options.profile.app_role === "solicitante") {
    query = query.or(
      `requester_id.eq.${options.profile.id},created_by.eq.${options.profile.id}`,
    );
  } else if (managed === "general" || managed === "privado") {
    query = query.eq("formation_role", managed);
  }

  if (options.inbox) {
    query = query.in("status", inboxStatuses(options.profile.app_role));
  }

  if (options.status && options.status !== "todas") {
    query = query.eq("status", options.status as RequestStatus);
  }

  const q = options.q?.trim().replace(/[%_,()]/g, " ").trim();
  if (q) {
    query = query.or(`folio.ilike.%${q}%,title.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  return {
    rows: (data ?? []) as TrainingRequestWithPeople[],
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    error: error?.message ?? null,
  };
}

export async function getRequestBundle(id: string) {
  const supabase = await createClient();
  const [{ data: request }, { data: quotes }, { data: order }, { data: events }, { data: settings }] =
    await Promise.all([
      supabase.from("training_requests").select(PEOPLE_SELECT).eq("id", id).maybeSingle(),
      supabase.from("quotes").select("*").eq("request_id", id).order("created_at"),
      supabase.from("purchase_orders").select("*").eq("request_id", id).maybeSingle(),
      supabase
        .from("request_events")
        .select("*, actor:profiles!actor_id (full_name, email)")
        .eq("request_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

  return {
    request: request as TrainingRequestWithPeople | null,
    quotes: (quotes ?? []) as Quote[],
    order: (order as PurchaseOrder | null) ?? null,
    events: (events ?? []) as RequestEvent[],
    settings: settings as AppSettings | null,
  };
}

export async function listUsers(page = 1, q?: string) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("full_name")
    .range(from, to);

  const term = q?.trim().replace(/[%_,()]/g, " ");
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, count } = await query;
  return { rows: (data ?? []) as Profile[], count: count ?? 0, page, pageSize: PAGE_SIZE };
}

export async function getSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
  return data as AppSettings | null;
}

export function canManageFormation(role: AppRole, formationRole: string) {
  const managed = managedFormationRole(role);
  return managed === "both" || managed === formationRole;
}
