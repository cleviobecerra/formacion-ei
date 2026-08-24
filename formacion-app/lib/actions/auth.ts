"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa correo y contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes("fetch") || error.message.toLowerCase().includes("failed")) {
      return { error: "No hay conexión con Supabase. Reinicia `npm run dev` en formacion-app." };
    }
    return { error: error.message };
  }

  redirect("/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const area = String(formData.get("area") ?? "").trim();

  if (!fullName || !email || password.length < 8) {
    return { error: "Completa nombre, correo y una contraseña de al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  if (data.user && area) {
    await supabase.from("profiles").update({ area }).eq("id", data.user.id);
  }

  if (!data.session) {
    return {
      error:
        "Cuenta creada. Si tu proyecto exige confirmar el correo, revisa tu bandeja e inicia sesión después.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
