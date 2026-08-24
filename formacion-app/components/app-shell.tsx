"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Inbox,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/labels";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: typeof Inbox };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItems({
  links,
  pathname,
  onNavigate,
}: {
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive(pathname, link.href)
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountBlock({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{profile.full_name}</p>
        <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ROLE_LABELS[profile.app_role]}
        </p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = profile.app_role === "admin";
  const links: NavLink[] = [
    { href: "/", label: "Bandeja", icon: Inbox },
    { href: "/solicitudes", label: "Solicitudes", icon: ClipboardList },
    { href: "/solicitudes/nueva", label: "Nueva solicitud", icon: Plus },
    ...(isAdmin
      ? [
          { href: "/admin/usuarios", label: "Usuarios", icon: Users },
          { href: "/admin/configuracion", label: "Umbral y OC", icon: Settings },
        ]
      : []),
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="px-5 py-6">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            EI
          </p>
          <h1 className="text-lg font-semibold">Formación EI</h1>
        </div>
        <NavItems links={links} pathname={pathname} />
        <Separator />
        <AccountBlock profile={profile} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <SheetContent side="left" className="w-[min(20rem,88vw)] gap-0 p-0">
              <SheetHeader className="border-b pr-12">
                <SheetTitle>Formación EI</SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <NavItems
                  links={links}
                  pathname={pathname}
                  onNavigate={() => setMenuOpen(false)}
                />
                <Separator />
                <AccountBlock profile={profile} />
              </div>
            </SheetContent>
          </Sheet>
          <p className="min-w-0 truncate font-semibold">Formación EI</p>
        </header>
        <main className="min-w-0 flex-1 bg-muted/30 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
