import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, FORMATION_LABELS } from "@/lib/labels";
import type { FormationRole, RequestStatus } from "@/lib/types";

const STATUS_CLASS: Record<RequestStatus, string> = {
  borrador: "bg-muted text-muted-foreground",
  en_revision: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  observada: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  en_cotizacion: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100",
  pendiente_presupuesto: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100",
  aprobada: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  oc_registrada: "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100",
  cerrada: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  rechazada: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="secondary" className={STATUS_CLASS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: FormationRole }) {
  return (
    <Badge variant="outline">
      {FORMATION_LABELS[role]}
    </Badge>
  );
}
