import type { Metadata } from "next";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import {
  adminSections,
  canAccessSection,
  roleLabels,
} from "@/lib/auth/access";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const principal = await requireSectionAccess("dashboard");
  const visibleSections = adminSections.filter(
    (section) =>
      section.id !== "dashboard" && canAccessSection(principal.roles, section.id),
  );

  return (
    <div>
      <div className="border-b border-border pb-8">
        <p className="text-xs font-bold tracking-[0.15em] text-accent-dark uppercase">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Bun venit, {principal.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Modulele editoriale, comerciale și de analiză apar numai dacă rolurile active permit accesul. Datele publice și rapoartele folosesc aceleași surse validate.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-soft text-brand">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Acces server-side activ</h2>
              <p className="text-sm text-muted">Rolurile sunt recitite la fiecare boundary admin.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {principal.roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-border bg-paper px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {roleLabels[role]}
              </span>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-brand p-6 text-white">
          <p className="text-xs font-bold tracking-[0.14em] text-white/60 uppercase">
            Etapa curentă
          </p>
          <p className="mt-3 text-lg font-semibold">Platformă editorială operațională</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Catalogul, Cartea Zilei, recomandările, partenerii, hub-urile SEO și profilele editoriale sunt conectate la fluxurile operaționale.
          </p>
        </aside>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-accent-dark uppercase">
              Module disponibile
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">Zona ta de lucru</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className="group rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-sm motion-reduce:transform-none"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{section.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{section.description}</p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted transition group-hover:text-foreground"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
