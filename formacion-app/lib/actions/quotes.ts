"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { managedFormationRole } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/requests";
import type { AppSettings, Quote, TrainingRequest } from "@/lib/types";

function canManageQuotes(role: ReturnType<typeof managedFormationRole>, formationRole: string) {
  return role === "both" || role === formationRole;
}

export async function addQuote(
  requestId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("training_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<TrainingRequest>();

  if (!request) return { error: "Solicitud no encontrada." };
  if (request.status !== "en_cotizacion") {
    return { error: "Solo se pueden cargar cotizaciones en esa etapa." };
  }
  if (!canManageQuotes(managedFormationRole(profile.app_role), request.formation_role)) {
    return { error: "Tu rol no gestiona esta solicitud." };
  }

  const vendor = String(formData.get("vendor_name") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  if (!vendor || !Number.isFinite(amount) || amount < 0) {
    return { error: "Proveedor y monto son obligatorios." };
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      request_id: requestId,
      vendor_name: vendor,
      amount,
      currency: String(formData.get("currency") ?? "CLP"),
      valid_until: String(formData.get("valid_until") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !quote) return { error: error?.message ?? "No se pudo guardar la cotización." };

  revalidatePath(`/solicitudes/${requestId}`);
  return { error: null, success: "Cotización agregada.", quoteId: quote.id };
}

export async function attachQuoteFile(
  requestId: string,
  quoteId: string,
  path: string,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("training_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<TrainingRequest>();

  if (!request) return { error: "Solicitud no encontrada." };
  if (!canManageQuotes(managedFormationRole(profile.app_role), request.formation_role)) {
    return { error: "Tu rol no gestiona esta solicitud." };
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, request_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote || quote.request_id !== requestId) return { error: "Cotización no encontrada." };

  const { error } = await supabase.from("quotes").update({ file_path: path }).eq("id", quoteId);
  if (error) return { error: error.message };
  revalidatePath(`/solicitudes/${requestId}`);
  return { error: null };
}

export async function selectQuote(requestId: string, quoteId: string): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: request }, { data: quotes }, { data: settings }] = await Promise.all([
    supabase.from("training_requests").select("*").eq("id", requestId).maybeSingle<TrainingRequest>(),
    supabase.from("quotes").select("*").eq("request_id", requestId),
    supabase.from("app_settings").select("*").eq("id", 1).single<AppSettings>(),
  ]);

  if (!request) return { error: "Solicitud no encontrada." };
  if (request.status !== "en_cotizacion") return { error: "La solicitud no está en cotización." };
  if (!canManageQuotes(managedFormationRole(profile.app_role), request.formation_role)) {
    return { error: "Tu rol no gestiona esta solicitud." };
  }

  const selected = (quotes as Quote[] | null)?.find((quote) => quote.id === quoteId);
  if (!selected) return { error: "Cotización no encontrada." };

  await supabase.from("quotes").update({ is_selected: false }).eq("request_id", requestId);
  const { error: selectError } = await supabase
    .from("quotes")
    .update({ is_selected: true })
    .eq("id", quoteId);
  if (selectError) return { error: selectError.message };

  const threshold = Number(settings?.approval_threshold ?? 1000000);
  const nextStatus =
    Number(selected.amount) > threshold ? "pendiente_presupuesto" : "aprobada";

  const { error } = await supabase
    .from("training_requests")
    .update({ status: nextStatus, observation: null })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/solicitudes/${requestId}`);
  return {
    error: null,
    success:
      nextStatus === "aprobada"
        ? "Cotización seleccionada. No supera el umbral; queda aprobada."
        : "Cotización seleccionada. Pasa a aprobación de presupuesto.",
  };
}

export async function registerPurchaseOrder(
  requestId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("training_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<TrainingRequest>();

  if (!request) return { error: "Solicitud no encontrada." };
  if (request.status !== "aprobada") {
    return { error: "La OC se registra cuando la solicitud ya está aprobada." };
  }
  if (!canManageQuotes(managedFormationRole(profile.app_role), request.formation_role)) {
    return { error: "Tu rol no gestiona esta solicitud." };
  }

  const erp = String(formData.get("erp_oc_number") ?? "").trim();
  const vendor = String(formData.get("vendor_name") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const issuedOn = String(formData.get("issued_on") ?? "").trim();
  if (!erp || !vendor || !issuedOn || !Number.isFinite(amount)) {
    return { error: "Número de OC, proveedor, monto y fecha son obligatorios." };
  }

  const { data: selected } = await supabase
    .from("quotes")
    .select("id")
    .eq("request_id", requestId)
    .eq("is_selected", true)
    .maybeSingle();

  const { data: order, error } = await supabase
    .from("purchase_orders")
    .insert({
      request_id: requestId,
      quote_id: selected?.id ?? null,
      erp_oc_number: erp,
      vendor_name: vendor,
      amount,
      issued_on: issuedOn,
      notes: String(formData.get("notes") ?? "") || null,
      registered_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !order) return { error: error?.message ?? "No se pudo registrar la OC." };

  const { error: statusError } = await supabase
    .from("training_requests")
    .update({ status: "oc_registrada" })
    .eq("id", requestId);

  if (statusError) return { error: statusError.message };
  revalidatePath("/");
  revalidatePath(`/solicitudes/${requestId}`);
  return { error: null, success: "OC del ERP registrada.", orderId: order.id };
}

export async function attachOrderFile(
  requestId: string,
  orderId: string,
  path: string,
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("training_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<TrainingRequest>();

  if (!request) return { error: "Solicitud no encontrada." };
  if (!canManageQuotes(managedFormationRole(profile.app_role), request.formation_role)) {
    return { error: "Tu rol no gestiona esta solicitud." };
  }

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("id, request_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.request_id !== requestId) return { error: "OC no encontrada." };

  const { error } = await supabase
    .from("purchase_orders")
    .update({ file_path: path })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath(`/solicitudes/${requestId}`);
  return { error: null };
}

export async function getSignedFileUrl(bucket: "quotes" | "oc-docs", path: string) {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
  if (error || !data) return null;
  return data.signedUrl;
}
