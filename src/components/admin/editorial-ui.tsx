import Link from "next/link";
import type { ReactNode } from "react";

export const fieldClass = "mt-2 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
export const labelClass = "block text-sm font-semibold text-foreground";

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? <Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover">{action.label}</Link> : null}
    </header>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-1.5 text-sm font-medium text-danger">{errors[0]}</p> : null;
}

export const statusLabels: Record<string, string> = {
  draft: "Ciornă",
  needs_review: "Necesită revizie",
  ready: "Pregătită",
  scheduled: "Programată",
  published: "Publicată",
  archived: "Arhivată",
};

export function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${published ? "bg-accent-soft text-brand" : "bg-paper text-muted"}`}>{statusLabels[status] ?? status}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">{children}</div>;
}
