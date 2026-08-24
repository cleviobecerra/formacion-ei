"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isFormationRole, managedFormationRole } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { FormationRole, RequestStatus, TrainingRequest } from "@/lib/types";

export type ActionState = {
  error: string | null;
  success?: string;
  quoteId?: string;
  orderId?: string;
};

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function num(formData: FormData, key: string) {
  const raw = str(formData, key);
  if (!raw) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export async function createRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  const title = str(formData, "title");
  const justification = str(formData, "justification");
  const formationRole = str(formData, "formation_role") as FormationRole | null;
  const asDraft = formData.get("intent") === "draft";

  if (!title || !justification || !formationRole) {
    return { error: "Título, justificación y rol de formación son obligatorios." };
  }
  if (formationRole !== "general" && formationRole !== "privado") {
    return { error: "Rol de formación inválido." };
  }
  if (profile.app_role === "formacion_general" && formationRole !== "general") {
    return { error: "Tu equipo solo puede gestionar Rol general." };
  }
  if (profile.app_role === "formacion_privado" && formationRole !== "privado") {
    return { error: "Tu equipo solo puede gestionar Rol privado." };
  }

  let requesterId = profile.id;
  const onBehalf = str(formData, "requester_id");
  if (onBehalf && onBehalf !== profile.id) {
    if (!isFormationRole(profile.app_role)) {
      return { error: "No puedes crear solicitudes en nombre de otra persona." };
    }
    requesterId = onBehalf;
  }

  const status: RequestStatus = asDraft ? "borrador" : "en_revision";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_requests")
    .insert({
      title,
      justification,
      formation_role: formationRole,
      status,
      training_type: str(formData, "training_type"),
      suggested_provider: str(formData, "suggested_provider"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      participants_count: num(formData, "participants_count") ?? 1,
      participants_detail: str(formData, "participants_detail"),
      estimated_amount: num(formData, "estimated_amount"),
      requester_id: requesterId,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear la solicitud." };

  revalidatePath("/");
  revalidatePath("/solicitudes");
  redirect(`/solicitudes/${data.id}`);
}

export async function updateRequest(
  requestId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("training_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<TrainingRequest>();

  if (!current) return { error: "Solicitud no encontrada." };

  const canEdit =
    (current.requester_id === profile.id &&
      (current.status === "borrador" || current.status === "observada")) ||
    profile.app_role === "admin";

  if (!canEdit) return { error: "No puedes editar esta solicitud." };

  const title = str(formData, "title");
  const justification = str(formData, "justification");
  if (!title || !justification) {
    return { error: "Título y justificación son obligatorios." };
  }

  const submit = formData.get("intent") === "submit";
  const { error } = await supabase
    .from("training_requests")
    .update({
      title,
      justification,
      training_type: str(formData, "training_type"),
      suggested_provider: str(formData, "suggested_provider"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      participants_count: num(formData, "participants_count") ?? current.participants_count,
      participants_detail: str(formData, "participants_detail"),
      estimated_amount: num(formData, "estimated_amount"),
      observation: submit ? null : current.observation,
      status: submit ? "en_revision" : current.status,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath(`/solicitudes/${requestId}`);
  return { error: null, success: submit ? "Solicitud enviada a Formación." : "Cambios guardados." };
}

export async function transitionRequest(
  requestId: string,
  nextStatus: RequestStatus,
  comment?: string,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("training_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<TrainingRequest>();

  if (!current) return { error: "Solicitud no encontrada." };

  const managed = managedFormationRole(profile.app_role);
  const isOwner = current.requester_id === profile.id;
  const isFormation =
    managed === "both" || managed === current.formation_role;
  const isBudget = profile.app_role === "presupuesto" || profile.app_role === "admin";

  const allowed =
    (nextStatus === "en_cotizacion" && isFormation && current.status === "en_revision") ||
    (nextStatus === "observada" && isFormation && current.status === "en_revision") ||
    (nextStatus === "rechazada" &&
      ((isFormation && ["en_revision", "en_cotizacion", "observada"].includes(current.status)) ||
        (isBudget && current.status === "pendiente_presupuesto"))) ||
    (nextStatus === "en_revision" && isOwner && current.status === "observada") ||
    (nextStatus === "aprobada" && isBudget && current.status === "pendiente_presupuesto") ||
    (nextStatus === "cerrada" &&
      isFormation &&
      (current.status === "oc_registrada" || current.status === "aprobada"));

  if (!allowed) return { error: "No tienes permiso para este cambio de estado." };
  if ((nextStatus === "observada" || nextStatus === "rechazada") && !comment) {
    return { error: "Indica un comentario o motivo." };
  }

  const { error } = await supabase
    .from("training_requests")
    .update({
      status: nextStatus,
      observation: nextStatus === "observada" ? comment : current.observation,
      rejected_reason: nextStatus === "rechazada" ? comment : current.rejected_reason,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/solicitudes/${requestId}`);
  return { error: null, success: "Estado actualizado." };
}

export async function searchUsers(query: string) {
  const profile = await requireProfile();
  if (!isFormationRole(profile.app_role) && profile.app_role !== "presupuesto") {
    return [];
  }

  const q = query.trim().replace(/[%_,()]/g, " ").trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, area")
    .eq("active", true)
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    .order("full_name")
    .limit(10);

  return data ?? [];
}
