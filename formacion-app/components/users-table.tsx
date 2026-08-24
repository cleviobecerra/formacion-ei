"use client";

import { useState } from "react";
import { updateUserRole } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/labels";
import { APP_ROLES, type AppRole, type Profile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UsersTable({ users }: { users: Profile[] }) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {users.map((user) => (
          <li key={user.id} className="rounded-xl border p-4">
            <UserEditor user={user} layout="card" />
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <UserEditor user={user} layout="row" />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function UserEditor({
  user,
  layout,
}: {
  user: Profile;
  layout: "card" | "row";
}) {
  const [role, setRole] = useState<AppRole>(user.app_role);
  const [active, setActive] = useState(user.active);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const roleSelect = (
    <select
      className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
      value={role}
      onChange={(event) => setRole(event.target.value as AppRole)}
    >
      {APP_ROLES.map((item) => (
        <option key={item} value={item}>
          {ROLE_LABELS[item]}
        </option>
      ))}
    </select>
  );

  const activeToggle = (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={active}
        onChange={(event) => setActive(event.target.checked)}
      />
      {active ? <Badge>Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
    </label>
  );

  const saveButton = (
    <Button
      size="sm"
      variant="outline"
      className={layout === "card" ? "w-full" : undefined}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await updateUserRole(user.id, role, active);
        setMessage(result.error ?? result.success ?? null);
        setPending(false);
      }}
    >
      Guardar
    </Button>
  );

  if (layout === "card") {
    return (
      <div className="space-y-3">
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="break-all text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">{user.area ?? "Sin área"}</p>
        </div>
        {roleSelect}
        {activeToggle}
        {saveButton}
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    );
  }

  return (
    <>
      <TableCell>
        <div className="font-medium">{user.full_name}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell>{user.area ?? "—"}</TableCell>
      <TableCell>{roleSelect}</TableCell>
      <TableCell>{activeToggle}</TableCell>
      <TableCell className="text-right">
        {saveButton}
        {message ? (
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        ) : null}
      </TableCell>
    </>
  );
}
