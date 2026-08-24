"use client";

import { useActionState } from "react";
import { attachOrderFile, registerPurchaseOrder } from "@/lib/actions/quotes";
import { formatDate, formatMoney } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/requests";
import type { PurchaseOrder, Quote } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileLink } from "@/components/file-link";
import { uploadRequestFile, validateUploadFile } from "@/lib/storage-upload";

const initial: ActionState = { error: null };
const OC_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;

async function submitOrder(
  requestId: string,
  prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  formData.delete("file");
  if (file instanceof File && file.size > 0) {
    const invalid = validateUploadFile(file, OC_TYPES);
    if (invalid) return { error: invalid };
  }

  const result = await registerPurchaseOrder(requestId, prev, formData);
  if (result.error) return result;
  if (!(file instanceof File && file.size > 0)) return result;
  if (!result.orderId) {
    return { error: "OC registrada, pero no se pudo adjuntar el respaldo." };
  }

  const uploaded = await uploadRequestFile("oc-docs", requestId, result.orderId, file);
  if (uploaded.error || !uploaded.path) {
    return {
      error: `OC registrada, pero el archivo no se subió: ${uploaded.error ?? "error desconocido"}`,
    };
  }

  const attached = await attachOrderFile(requestId, result.orderId, uploaded.path);
  if (attached.error) {
    return { error: `OC registrada, pero el archivo no quedó asociado: ${attached.error}` };
  }
  return result;
}

export function OcPanel({
  requestId,
  order,
  selectedQuote,
  canRegister,
}: {
  requestId: string;
  order: PurchaseOrder | null;
  selectedQuote: Quote | null;
  canRegister: boolean;
}) {
  const [state, action, pending] = useActionState(
    (prev: ActionState, formData: FormData) => submitOrder(requestId, prev, formData),
    initial,
  );

  if (order) {
    return (
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <Item label="N° OC ERP" value={order.erp_oc_number} />
        <Item label="Proveedor" value={order.vendor_name} />
        <Item label="Monto" value={formatMoney(order.amount)} />
        <Item label="Fecha OC" value={formatDate(order.issued_on)} />
        {order.notes ? <Item label="Notas" value={order.notes} /> : null}
        {order.file_path ? (
          <div>
            <dt className="text-muted-foreground">Respaldo</dt>
            <dd>
              <FileLink bucket="oc-docs" path={order.file_path} />
            </dd>
          </div>
        ) : null}
      </dl>
    );
  }

  if (!canRegister) {
    return (
      <p className="text-sm text-muted-foreground">
        La OC oficial se emite en el ERP. Aquí se registra el número cuando exista.
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="erp_oc_number">Número de OC (ERP)</Label>
        <Input id="erp_oc_number" name="erp_oc_number" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vendor_name">Proveedor</Label>
        <Input
          id="vendor_name"
          name="vendor_name"
          required
          defaultValue={selectedQuote?.vendor_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="1"
          required
          defaultValue={selectedQuote?.amount ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issued_on">Fecha de emisión</Label>
        <Input id="issued_on" name="issued_on" type="date" required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="file">Respaldo (PDF o imagen)</Label>
        <Input id="file" name="file" type="file" accept="application/pdf,image/png,image/jpeg" />
        <p className="text-xs text-muted-foreground">PDF, PNG o JPG, máximo 10 MB.</p>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive md:col-span-2">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 md:col-span-2">{state.success}</p>
      ) : null}
      <div className="md:col-span-2">
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Registrando…" : "Registrar OC del ERP"}
        </Button>
      </div>
    </form>
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
