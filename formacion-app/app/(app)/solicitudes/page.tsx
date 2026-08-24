import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { listRequests } from "@/lib/queries";
import { RequestTable } from "@/components/request-table";
import { REQUEST_STATUSES } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const { rows, count, pageSize } = await listRequests({
    profile,
    q: params.q,
    status: params.status,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">{count} registros visibles para ti.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/solicitudes/nueva">Nueva solicitud</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" action="/solicitudes">
            <Input
              name="q"
              placeholder="Folio o título"
              defaultValue={params.q ?? ""}
              className="w-full sm:max-w-xs"
            />
            <select
              name="status"
              defaultValue={params.status ?? "todas"}
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm sm:w-auto"
            >
              <option value="todas">Todos los estados</option>
              {REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes con esos filtros.</p>
          ) : (
            <RequestTable rows={rows} />
          )}
          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button asChild variant="outline" className="flex-1 sm:flex-none">
                    <Link
                      href={`/solicitudes?q=${encodeURIComponent(params.q ?? "")}&status=${params.status ?? "todas"}&page=${page - 1}`}
                    >
                      Anterior
                    </Link>
                  </Button>
                ) : null}
                {page < totalPages ? (
                  <Button asChild variant="outline" className="flex-1 sm:flex-none">
                    <Link
                      href={`/solicitudes?q=${encodeURIComponent(params.q ?? "")}&status=${params.status ?? "todas"}&page=${page + 1}`}
                    >
                      Siguiente
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
