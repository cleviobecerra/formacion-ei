import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return (profile as Profile | null) ?? null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login?error=inactive");
  return profile;
}

export async function requireRole(roles: AppRole[]) {
  const profile = await requireProfile();
  if (!roles.includes(profile.app_role)) redirect("/");
  return profile;
}
