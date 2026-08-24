import { requireProfile } from "@/lib/auth";
import { RequestForm } from "@/components/request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NuevaSolicitudPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Nueva solicitud</h1>
        <p className="text-sm text-muted-foreground">
          Asigna la solicitud a Rol general o Rol privado. Cada equipo solo verá las suyas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la capacitación</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
