"use client";

import { useActionState, useState } from "react";
import { createRequest, updateRequest, type ActionState } from "@/lib/actions/requests";
import { isFormationRole } from "@/lib/labels";
import type { FormationRole, Profile, TrainingRequest } from "@/lib/types";
import { UserPicker } from "@/components/user-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initial: ActionState = { error: null };

export function RequestForm({
  profile,
  request,
}: {
  profile: Profile;
  request?: TrainingRequest;
}) {
  const action = request
    ? updateRequest.bind(null, request.id)
    : createRequest;
  const [state, formAction, pending] = useActionState(action, initial);
  const lockedRole: FormationRole | null =
    profile.app_role === "formacion_general"
      ? "general"
      : profile.app_role === "formacion_privado"
        ? "privado"
        : null;
  const [formationRole, setFormationRole] = useState<FormationRole>(
    request?.formation_role ?? lockedRole ?? "general",
  );
  const canPickUser = isFormationRole(profile.app_role);

  return (
    <form action={formAction} className="space-y-5">
      {canPickUser && !request ? (
        <UserPicker
          defaultRequester={{
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            area: profile.area,
          }}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Nombre de la capacitación</Label>
        <Input id="title" name="title" required defaultValue={request?.title} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="formation_role">Rol de formación</Label>
          {request || lockedRole ? (
            <>
              <input type="hidden" name="formation_role" value={request?.formation_role ?? lockedRole ?? ""} />
              <Input
                id="formation_role"
                value={
                  (request?.formation_role ?? lockedRole) === "privado"
                    ? "Rol privado"
                    : "Rol general"
                }
                disabled
              />
            </>
          ) : (
            <>
              <input type="hidden" name="formation_role" value={formationRole} />
              <Select
                value={formationRole}
                onValueChange={(value) => setFormationRole(value as FormationRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Rol general</SelectItem>
                  <SelectItem value="privado">Rol privado</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="training_type">Tipo</Label>
          <Input
            id="training_type"
            name="training_type"
            placeholder="Curso, diploma, certificación…"
            defaultValue={request?.training_type ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="justification">Justificación</Label>
        <Textarea
          id="justification"
          name="justification"
          required
          rows={5}
          defaultValue={request?.justification}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="suggested_provider">Proveedor sugerido</Label>
          <Input
            id="suggested_provider"
            name="suggested_provider"
            defaultValue={request?.suggested_provider ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_amount">Monto estimado</Label>
          <Input
            id="estimated_amount"
            name="estimated_amount"
            type="number"
            min="0"
            step="1"
            defaultValue={request?.estimated_amount ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">Inicio</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={request?.start_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Término</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={request?.end_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="participants_count">N° participantes</Label>
          <Input
            id="participants_count"
            name="participants_count"
            type="number"
            min="1"
            defaultValue={request?.participants_count ?? 1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="participants_detail">Detalle de participantes</Label>
          <Input
            id="participants_detail"
            name="participants_detail"
            defaultValue={request?.participants_detail ?? ""}
          />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {!request || request.status === "borrador" ? (
          <Button type="submit" name="intent" value="draft" variant="outline" className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap" disabled={pending}>
            Guardar borrador
          </Button>
        ) : null}
        <Button type="submit" name="intent" value="submit" className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap" disabled={pending}>
          {pending ? "Guardando…" : request ? "Enviar a Formación" : "Enviar solicitud"}
        </Button>
      </div>
    </form>
  );
}
