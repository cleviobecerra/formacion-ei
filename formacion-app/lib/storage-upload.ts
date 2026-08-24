import { createClient } from "@/lib/supabase/client";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUploadFile(
  file: File,
  allowed: readonly string[],
): string | null {
  if (file.size <= 0) return "El archivo está vacío.";
  if (file.size > MAX_UPLOAD_BYTES) return "El archivo no puede superar 10 MB.";
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const mimeOk = allowed.includes(type);
  const extOk = allowed.some((item) => {
    if (item === "application/pdf") return name.endsWith(".pdf");
    if (item === "image/png") return name.endsWith(".png");
    if (item === "image/jpeg") return name.endsWith(".jpg") || name.endsWith(".jpeg");
    return false;
  });
  if (!mimeOk && !extOk) {
    return allowed.includes("application/pdf") && allowed.length === 1
      ? "Solo se acepta PDF."
      : "Formato no permitido. Usa PDF, PNG o JPG.";
  }
  return null;
}

export async function uploadRequestFile(
  bucket: "quotes" | "oc-docs",
  requestId: string,
  entityId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "bin");
  const path = `${requestId}/${entityId}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) return { error: error.message };
  return { path };
}
