import { ArrowRight } from "lucide-react";
import Link from "next/link";

export type RelatedHubLink = {
  href: string;
  title: string;
  eyebrow: string;
};

export function RelatedHubNavigation({ hubs }: { hubs: RelatedHubLink[] }) {
  if (!hubs.length) return null;
  return (
    <section aria-labelledby="related-hubs-title" className="border-t border-border pt-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Continuă descoperirea</p>
      <h2 id="related-hubs-title" className="mt-3 font-display text-3xl font-semibold">Selecții editoriale apropiate</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hubs.map((hub) => (
          <Link key={hub.href} href={hub.href} className="group rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">{hub.eyebrow}</span>
            <strong className="mt-2 block font-display text-xl font-semibold">{hub.title}</strong>
            <span className="mt-4 inline-flex items-center text-sm font-bold text-brand">Vezi selecția<ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
