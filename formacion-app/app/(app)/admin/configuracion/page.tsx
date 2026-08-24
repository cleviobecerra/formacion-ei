import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { ThresholdForm } from "@/components/threshold-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminConfigPage() {
  await requireRole(["admin"]);
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Umbral para derivar cotizaciones a Presupuesto. La OC oficial sigue viviendo en el ERP.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Aprobación por monto</CardTitle>
          <CardDescription>Valor inicial 1.000.000 CLP, editable.</CardDescription>
        </CardHeader>
        <CardContent>
          {settings ? (
            <ThresholdForm settings={settings} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay configuración. Aplica la migración de Supabase primero.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
