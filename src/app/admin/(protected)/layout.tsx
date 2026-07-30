import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out";
import { SkipLink } from "@/components/layout/skip-link";
import { Wordmark } from "@/components/layout/wordmark";
import {
  adminNavigationSections,
  canAccessSection,
} from "@/lib/auth/access";
import { requireInternalPrincipal } from "@/lib/auth/principal";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { getUnreadContactCount } from "@/domain/communication/contact-service";
import { hasPermission } from "@/lib/auth/permissions";

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
  const [principal, settings] = await Promise.all([requireInternalPrincipal(), getPublicSiteSettings()]);
  const sections = adminNavigationSections.filter((section) =>
    canAccessSection(principal.permissions, section.id, principal.isSuperAdmin),
  );
  const roleLabel = principal.roleNames.join(", ") || "Fără rol";
  const unreadMessages = hasPermission(principal.permissions, "contact_messages.view", principal.isSuperAdmin) ? await getUnreadContactCount() : 0;

  return (
    <div className="min-h-screen bg-paper font-sans text-foreground">
      <SkipLink />
      <Suspense fallback={null}><AdminNotice /></Suspense>

      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 border-e border-border bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-5">
          <Wordmark siteName={settings.siteName} logoAssetId={settings.logoAssetId} />
          <p className="mt-1 text-xs font-medium text-muted">Administrare editorială</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <AdminNavigation sections={sections} />
        </div>
        <div className="border-t border-border p-4">
          <p className="truncate px-3 text-sm font-semibold">{principal.name}</p>
          <p className="mt-1 truncate px-3 text-xs text-muted">{principal.email}</p>
          <p className="mt-1 px-3 text-xs font-medium text-accent-dark">
            {roleLabel}
          </p>
          <Link href="/admin/account" className="mt-3 flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted hover:bg-paper hover:text-foreground">Contul meu</Link>
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
            roleLabel={roleLabel}
            siteName={settings.siteName}
            logoAssetId={settings.logoAssetId}
          />
          <p className="text-sm font-semibold">Administrare editorială</p>
        </header>
        <main
          id="continut-principal"
          className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          {unreadMessages > 0 ? <Link href="/admin/messages?status=new" className="mb-6 flex items-center justify-between rounded-xl border border-brand/20 bg-accent-soft px-4 py-3 text-sm font-semibold text-brand"><span>{unreadMessages} {unreadMessages === 1 ? "mesaj nou" : "mesaje noi"} în inbox</span><span aria-hidden="true">→</span></Link> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
