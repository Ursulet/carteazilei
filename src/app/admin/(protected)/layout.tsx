import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out";
import { SkipLink } from "@/components/layout/skip-link";
import { Wordmark } from "@/components/layout/wordmark";
import {
  adminSections,
  canAccessSection,
  roleLabels,
} from "@/lib/auth/access";
import { requireInternalPrincipal } from "@/lib/auth/principal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Administrare",
    template: "%s | Administrare Cartea Zilei",
  },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const principal = await requireInternalPrincipal();
  const sections = adminSections.filter((section) =>
    canAccessSection(principal.roles, section.id),
  );
  const primaryRole = principal.roles.includes("admin")
    ? "admin"
    : principal.roles.includes("editor")
      ? "editor"
      : "analyst";

  return (
    <div className="min-h-screen bg-paper font-sans text-foreground">
      <SkipLink />

      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 border-e border-border bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-5">
          <Wordmark />
          <p className="mt-1 text-xs font-medium text-muted">Administrare editorială</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <AdminNavigation sections={sections} />
        </div>
        <div className="border-t border-border p-4">
          <p className="truncate px-3 text-sm font-semibold">{principal.name}</p>
          <p className="mt-1 truncate px-3 text-xs text-muted">{principal.email}</p>
          <p className="mt-1 px-3 text-xs font-medium text-accent-dark">
            {roleLabels[primaryRole]}
          </p>
          <div className="mt-3">
            <AdminSignOutButton />
          </div>
        </div>
      </aside>

      <div className="lg:ps-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-4 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6 lg:hidden">
          <AdminMobileMenu
            sections={sections}
            name={principal.name}
            email={principal.email}
            roleLabel={roleLabels[primaryRole]}
          />
          <p className="text-sm font-semibold">Administrare editorială</p>
        </header>
        <main
          id="continut-principal"
          className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

