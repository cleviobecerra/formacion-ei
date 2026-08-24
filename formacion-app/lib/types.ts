export const APP_ROLES = [
  "solicitante",
  "formacion_general",
  "formacion_privado",
  "presupuesto",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const FORMATION_ROLES = ["general", "privado"] as const;
export type FormationRole = (typeof FORMATION_ROLES)[number];

export const REQUEST_STATUSES = [
  "borrador",
  "en_revision",
  "observada",
  "en_cotizacion",
  "pendiente_presupuesto",
  "aprobada",
  "oc_registrada",
  "cerrada",
  "rechazada",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  area: string | null;
  app_role: AppRole;
  active: boolean;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: number;
  approval_threshold: number;
  currency: string;
  updated_at: string;
  updated_by: string | null;
};

export type TrainingRequest = {
  id: string;
  folio: string | null;
  formation_role: FormationRole;
  status: RequestStatus;
  title: string;
  justification: string;
  training_type: string | null;
  suggested_provider: string | null;
  start_date: string | null;
  end_date: string | null;
  participants_count: number;
  participants_detail: string | null;
  estimated_amount: number | null;
  requester_id: string;
  created_by: string;
  rejected_reason: string | null;
  observation: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingRequestWithPeople = TrainingRequest & {
  requester: Pick<Profile, "id" | "full_name" | "email" | "area"> | null;
  creator: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export type Quote = {
  id: string;
  request_id: string;
  vendor_name: string;
  amount: number;
  currency: string;
  valid_until: string | null;
  file_path: string | null;
  notes: string | null;
  is_selected: boolean;
  created_by: string;
  created_at: string;
};

export type PurchaseOrder = {
  id: string;
  request_id: string;
  quote_id: string | null;
  erp_oc_number: string;
  vendor_name: string;
  amount: number;
  issued_on: string;
  file_path: string | null;
  notes: string | null;
  registered_by: string;
  created_at: string;
};

export type RequestEvent = {
  id: number;
  request_id: string;
  actor_id: string | null;
  from_status: RequestStatus | null;
  to_status: RequestStatus | null;
  comment: string | null;
  created_at: string;
  actor: Pick<Profile, "full_name" | "email"> | null;
};
