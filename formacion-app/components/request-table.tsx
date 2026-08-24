import Link from "next/link";
import { RoleBadge, StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/labels";
import type { TrainingRequestWithPeople } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RequestTable({ rows }: { rows: TrainingRequestWithPeople[] }) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/solicitudes/${row.id}`}
              className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.folio ?? "Sin folio"}</p>
                  <p className="truncate font-medium">{row.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.requester?.full_name ?? "—"}
                    {row.requester?.area ? ` · ${row.requester.area}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDate(row.created_at)}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleBadge role={row.formation_role} />
                <StatusBadge status={row.status} />
                <span className="text-xs text-muted-foreground">
                  {formatMoney(row.estimated_amount)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Capacitación</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link href={`/solicitudes/${row.id}`} className="font-medium hover:underline">
                    {row.folio ?? "Sin folio"}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">{row.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(row.estimated_amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{row.requester?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{row.requester?.area}</div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={row.formation_role} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>{formatDate(row.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
