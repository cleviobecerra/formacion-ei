"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/requests";
import type { AppRole } from "@/lib/types";
import { APP_ROLES } from "@/lib/types";

export async function updateUserRole(
  userId: string,
  role: AppRole,
  active: boolean,
): Promise<ActionState> {
  await requireRole(["admin"]);
  if (!APP_ROLES.includes(role)) return { error: "Rol inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ app_role: role, active })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { error: null, success: "Usuario actualizado." };
}

export async function updateThreshold(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["admin"]);
  const threshold = Number(String(formData.get("approval_threshold") ?? "").replace(",", "."));
  const currency = String(formData.get("currency") ?? "CLP").trim() || "CLP";
  if (!Number.isFinite(threshold) || threshold < 0) {
    return { error: "El umbral debe ser un número válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ approval_threshold: threshold, currency })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/admin/configuracion");
  return { error: null, success: "Umbral actualizado." };
}
