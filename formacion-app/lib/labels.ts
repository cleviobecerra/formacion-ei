import type { AppRole, FormationRole, RequestStatus } from "@/lib/types";

export const ROLE_LABELS: Record<AppRole, string> = {
  solicitante: "Solicitante",
  formacion_general: "Formación · Rol general",
  formacion_privado: "Formación · Rol privado",
  presupuesto: "Presupuesto",
  admin: "Administrador",
};

export const FORMATION_LABELS: Record<FormationRole, string> = {
  general: "Rol general",
  privado: "Rol privado",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  observada: "Observada",
  en_cotizacion: "En cotización",
  pendiente_presupuesto: "Pendiente presupuesto",
  aprobada: "Aprobada",
  oc_registrada: "OC registrada",
  cerrada: "Cerrada",
  rechazada: "Rechazada",
};

export function formatMoney(amount: number | null | undefined, currency = "CLP") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(Number(amount));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isFormationRole(role: AppRole) {
  return role === "formacion_general" || role === "formacion_privado" || role === "admin";
}

export function managedFormationRole(role: AppRole): FormationRole | "both" | null {
  if (role === "admin") return "both";
  if (role === "formacion_general") return "general";
  if (role === "formacion_privado") return "privado";
  return null;
}

export function inboxStatuses(role: AppRole): RequestStatus[] {
  if (role === "solicitante") {
    return ["borrador", "observada", "en_revision", "en_cotizacion", "pendiente_presupuesto", "aprobada"];
  }
  if (role === "formacion_general" || role === "formacion_privado") {
    return ["en_revision", "observada", "en_cotizacion", "aprobada"];
  }
  if (role === "presupuesto") return ["pendiente_presupuesto"];
  return [
    "en_revision",
    "observada",
    "en_cotizacion",
    "pendiente_presupuesto",
    "aprobada",
  ];
}
