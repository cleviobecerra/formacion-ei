import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canManageFormation, getRequestBundle } from "@/lib/queries";
import { formatDate, formatMoney, FORMATION_LABELS, ROLE_LABELS } from "@/lib/labels";
import { RoleBadge, StatusBadge } from "@/components/status-badge";
import { RequestForm } from "@/components/request-form";
import { QuotesPanel } from "@/components/quotes-panel";
import { OcPanel } from "@/components/oc-panel";
import { RequestTimeline } from "@/components/request-timeline";
import { WorkflowActions } from "@/components/workflow-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RequestStatus } from "@/lib/types";

export default async function SolicitudDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const { request, quotes, order, events, settings } = await getRequestBundle(id);
  if (!request) notFound();

  const isOwner = request.requester_id === profile.id;
  const formation = canManageFormation(profile.app_role, request.formation_role);
  const isBudget = profile.app_role === "presupuesto" || profile.app_role === "admin";
  const canEdit =
    (isOwner && (request.status === "borrador" || request.status === "observada")) ||
    profile.app_role === "admin";
  const selectedQuote = quotes.find((quote) => quote.is_selected) ?? null;

  const actions: {
    status: RequestStatus;
    label: string;
    variant?: "default" | "destructive" | "outline";
    needsComment?: boolean;
  }[] = [];

  if (formation && request.status === "en_revision") {
    actions.push({ status: "en_cotizacion", label: "Pasar a cotización" });
    actions.push({
      status: "observada",
      label: "Observar",
      variant: "outline",
      needsComment: true,
    });
    actions.push({
      status: "rechazada",
      label: "Rechazar",
      variant: "destructive",
      needsComment: true,
    });
  }
  if (isOwner && request.status === "observada") {
    actions.push({ status: "en_revision", label: "Reenviar a Formación" });
  }
  if (isBudget && request.status === "pendiente_presupuesto") {
    actions.push({ status: "aprobada", label: "Aprobar presupuesto" });
    actions.push({
      status: "rechazada",
      label: "Rechazar",
      variant: "destructive",
      needsComment: true,
    });
  }
  if (formation && request.status === "oc_registrada") {
    actions.push({ status: "cerrada", label: "Cerrar solicitud" });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{request.folio ?? "Sin folio"}</p>
          <h1 className="text-xl font-semibold tracking-tight break-words sm:text-2xl">{request.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={request.status} />
            <RoleBadge role={request.formation_role} />
          </div>
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          Umbral de aprobación: {formatMoney(settings?.approval_threshold ?? 1000000, settings?.currency)}
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
            <CardDescription className="break-words">
              Solicitante: {request.requester?.full_name} · {request.requester?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="break-words whitespace-pre-wrap">{request.justification}</p>
            <dl className="grid gap-3 md:grid-cols-2">
              <Item label="Tipo" value={request.training_type ?? "—"} />
              <Item label="Proveedor sugerido" value={request.suggested_provider ?? "—"} />
              <Item label="Inicio" value={formatDate(request.start_date)} />
              <Item label="Término" value={formatDate(request.end_date)} />
              <Item label="Participantes" value={String(request.participants_count)} />
              <Item label="Estimado" value={formatMoney(request.estimated_amount)} />
              <Item label="Rol" value={FORMATION_LABELS[request.formation_role]} />
              <Item
                label="Creada por"
                value={`${request.creator?.full_name ?? "—"} (${ROLE_LABELS[profile.app_role]})`}
              />
            </dl>
            {request.observation ? (
              <p className="rounded-lg bg-amber-50 p-3 break-words text-amber-950">
                Observación: {request.observation}
              </p>
            ) : null}
            {request.rejected_reason ? (
              <p className="rounded-lg bg-red-50 p-3 break-words text-red-900">
                Motivo de rechazo: {request.rejected_reason}
              </p>
            ) : null}
            <WorkflowActions requestId={request.id} actions={actions} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Bitácora</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestTimeline events={events} />
          </CardContent>
        </Card>
      </div>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestForm profile={profile} request={request} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones</CardTitle>
          <CardDescription>Compara ofertas y selecciona una. Si supera el umbral, pasa a presupuesto.</CardDescription>
        </CardHeader>
        <CardContent>
          <QuotesPanel
            requestId={request.id}
            quotes={quotes}
            canManage={formation && request.status === "en_cotizacion"}
            canSelect={formation && request.status === "en_cotizacion"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orden de compra (ERP)</CardTitle>
          <CardDescription>
            Esta app no emite la OC. Solo registra el número y respaldo del ERP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OcPanel
            requestId={request.id}
            order={order}
            selectedQuote={selectedQuote}
            canRegister={formation && request.status === "aprobada"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}
