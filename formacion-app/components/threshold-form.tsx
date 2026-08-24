"use client";

import { useActionState } from "react";
import { updateThreshold } from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/requests";
import type { AppSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionState = { error: null };

export function ThresholdForm({ settings }: { settings: AppSettings }) {
  const [state, action, pending] = useActionState(updateThreshold, initial);

  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="approval_threshold">Umbral de aprobación</Label>
        <Input
          id="approval_threshold"
          name="approval_threshold"
          type="number"
          min="0"
          step="1"
          required
          defaultValue={settings.approval_threshold}
        />
        <p className="text-xs text-muted-foreground">
          Si la cotización seleccionada supera este monto, entra Presupuesto.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Moneda</Label>
        <Input id="currency" name="currency" defaultValue={settings.currency} />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
