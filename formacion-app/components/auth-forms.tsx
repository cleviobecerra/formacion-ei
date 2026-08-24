"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: AuthState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Centraliza solicitudes, cotizaciones y seguimiento de OC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <Field id="email" label="Correo" type="email" autoComplete="email" />
          <Field
            id="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
          />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Ingresando…" : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Primera vez?{" "}
            <Link href="/registro" className="font-medium text-foreground underline">
              Crear cuenta de solicitante
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initial);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Registro</CardTitle>
        <CardDescription>
          Las cuentas nuevas entran como solicitante. Formación y presupuesto los
          asigna un administrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <Field id="full_name" label="Nombre completo" autoComplete="name" />
          <Field id="area" label="Área / gerencia" />
          <Field id="email" label="Correo" type="email" autoComplete="email" />
          <Field
            id="password"
            label="Contraseña (mín. 8)"
            type="password"
            autoComplete="new-password"
          />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando…" : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-foreground underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} autoComplete={autoComplete} required={id !== "area"} />
    </div>
  );
}
