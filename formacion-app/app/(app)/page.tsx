import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { listRequests } from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/labels";
import { RequestTable } from "@/components/request-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InboxPage() {
  const profile = await requireProfile();
  const { rows } = await listRequests({ profile, inbox: true, page: 1 });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Bandeja</h1>
          <p className="text-sm text-muted-foreground">
            Pendientes para {ROLE_LABELS[profile.app_role].toLowerCase()}.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/solicitudes/nueva">Nueva solicitud</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por atender</CardTitle>
          <CardDescription>
            Solo ves lo que corresponde a tu rol. Rol general y rol privado están aislados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pendientes en tu bandeja.</p>
          ) : (
            <RequestTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
