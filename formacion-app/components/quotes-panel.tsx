"use client";

import { useActionState, useState } from "react";
import { addQuote, attachQuoteFile, selectQuote } from "@/lib/actions/quotes";
import { formatDate, formatMoney } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/requests";
import type { Quote } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileLink } from "@/components/file-link";
import { uploadRequestFile, validateUploadFile } from "@/lib/storage-upload";

const initial: ActionState = { error: null };
const PDF_TYPES = ["application/pdf"] as const;

async function submitQuote(
  requestId: string,
  prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  formData.delete("file");
  if (file instanceof File && file.size > 0) {
    const invalid = validateUploadFile(file, PDF_TYPES);
    if (invalid) return { error: invalid };
  }

  const result = await addQuote(requestId, prev, formData);
  if (result.error) return result;
  if (!(file instanceof File && file.size > 0)) return result;
  if (!result.quoteId) {
    return { error: "Cotización guardada, pero no se pudo adjuntar el PDF." };
  }

  const uploaded = await uploadRequestFile("quotes", requestId, result.quoteId, file);
  if (uploaded.error || !uploaded.path) {
    return {
      error: `Cotización guardada, pero el PDF no se subió: ${uploaded.error ?? "error desconocido"}`,
    };
  }

  const attached = await attachQuoteFile(requestId, result.quoteId, uploaded.path);
  if (attached.error) {
    return { error: `Cotización guardada, pero el PDF no quedó asociado: ${attached.error}` };
  }
  return result;
}

export function QuotesPanel({
  requestId,
  quotes,
  canManage,
  canSelect,
}: {
  requestId: string;
  quotes: Quote[];
  canManage: boolean;
  canSelect: boolean;
}) {
  const [state, action, pending] = useActionState(
    (prev: ActionState, formData: FormData) => submitQuote(requestId, prev, formData),
    initial,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<ActionState>(initial);

  return (
    <div className="space-y-6">
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay cotizaciones.</p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {quotes.map((quote) => (
              <li key={quote.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{quote.vendor_name}</p>
                    <p className="text-sm">{formatMoney(quote.amount, quote.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      Vigencia: {formatDate(quote.valid_until)}
                    </p>
                    {quote.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{quote.notes}</p>
                    ) : null}
                    {quote.file_path ? (
                      <div className="mt-1">
                        <FileLink bucket="quotes" path={quote.file_path} label="Ver PDF" />
                      </div>
                    ) : null}
                  </div>
                  {quote.is_selected ? <Badge>Seleccionada</Badge> : null}
                </div>
                {!quote.is_selected && canSelect ? (
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    variant="outline"
                    disabled={busyId === quote.id}
                    onClick={async () => {
                      setBusyId(quote.id);
                      const result = await selectQuote(requestId, quote.id);
                      setMessage(result);
                      setBusyId(null);
                    }}
                  >
                    Elegir
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>
                  <div className="font-medium">{quote.vendor_name}</div>
                  {quote.notes ? (
                    <div className="text-xs text-muted-foreground">{quote.notes}</div>
                  ) : null}
                  {quote.file_path ? (
                    <FileLink bucket="quotes" path={quote.file_path} label="Ver PDF" />
                  ) : null}
                </TableCell>
                <TableCell>{formatMoney(quote.amount, quote.currency)}</TableCell>
                <TableCell>{formatDate(quote.valid_until)}</TableCell>
                <TableCell className="text-right">
                  {quote.is_selected ? (
                    <Badge>Seleccionada</Badge>
                  ) : canSelect ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === quote.id}
                      onClick={async () => {
                        setBusyId(quote.id);
                        const result = await selectQuote(requestId, quote.id);
                        setMessage(result);
                        setBusyId(null);
                      }}
                    >
                      Elegir
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
          </div>
        </>
      )}

      {message.error ? <p className="text-sm text-destructive">{message.error}</p> : null}
      {message.success ? <p className="text-sm text-emerald-700">{message.success}</p> : null}

      {canManage ? (
        <form action={action} className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <p className="font-medium">Nueva cotización</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Proveedor</Label>
            <Input id="vendor_name" name="vendor_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" min="0" step="1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Vigente hasta</Label>
            <Input id="valid_until" name="valid_until" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">PDF</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" />
            <p className="text-xs text-muted-foreground">PDF, máximo 10 MB.</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive md:col-span-2">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-emerald-700 md:col-span-2">{state.success}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
              {pending ? "Guardando…" : "Agregar cotización"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
