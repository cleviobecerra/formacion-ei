"use client";

import { useState } from "react";
import { getSignedFileUrl } from "@/lib/actions/quotes";

export function FileLink({
  bucket,
  path,
  label = "Ver archivo",
}: {
  bucket: "quotes" | "oc-docs";
  path: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="text-xs font-medium underline underline-offset-2"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const url = await getSignedFileUrl(bucket, path);
        setBusy(false);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      {busy ? "Abriendo…" : label}
    </button>
  );
}
