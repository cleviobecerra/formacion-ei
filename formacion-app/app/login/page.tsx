import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-muted/40 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 w-full max-w-md text-center">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          EI
        </p>
        <h1 className="text-2xl font-semibold">Formación EI</h1>
      </div>
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
