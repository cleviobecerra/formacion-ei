import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/queries";
import { UsersTable } from "@/components/users-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const { rows, count, pageSize } = await listUsers(page, params.q);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Usuarios y roles</h1>
        <p className="text-sm text-muted-foreground">
          El registro público crea solicitantes. Aquí se asigna Formación, Presupuesto o Admin.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" action="/admin/usuarios">
            <Input name="q" placeholder="Nombre o correo" defaultValue={params.q ?? ""} className="w-full sm:max-w-sm" />
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <UsersTable users={rows} />
          <p className="mt-4 text-sm text-muted-foreground">
            {count} usuarios · página {page} de {totalPages}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
