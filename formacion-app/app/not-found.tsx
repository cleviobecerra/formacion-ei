import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-xl font-semibold">No encontrado</h1>
      <p className="text-sm text-muted-foreground">La solicitud o página no existe o no tienes acceso.</p>
      <Link href="/" className="text-sm underline">
        Volver a la bandeja
      </Link>
    </div>
  );
}
