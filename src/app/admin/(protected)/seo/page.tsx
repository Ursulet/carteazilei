import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminEditorialLists, getAdminTaxonomies } from "@/db/queries/admin-seo-hubs";
import { getSearchIndexingOverview } from "@/domain/editorial/search-indexing-service";
import { canMutateSection } from "@/lib/auth/access";
import { requireSectionAccess } from "@/lib/auth/principal";

import { includePublishedContentInSearchAction } from "./actions";

export const metadata: Metadata = { title: "SEO și indexare" };

function ProgressCard({ label, indexed, eligible }: { label: string; indexed: number; eligible: number }) {
  const complete = eligible === 0 || indexed === eligible;
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold">{indexed} / {eligible}</p>
      <p className="mt-2 text-sm text-muted">
        {eligible === 0 ? "Nu există încă pagini publice eligibile." : complete ? "Incluse în sitemap." : `${eligible - indexed} pagini nu sunt încă în sitemap.`}
      </p>
    </article>
  );
}

export default async function Page() {
  const principal = await requireSectionAccess("seo");
  const canManageSeo = canMutateSection(principal.permissions, "seo", principal.isSuperAdmin);
  const [lists, taxonomies, overview] = await Promise.all([
    getAdminEditorialLists(),
    getAdminTaxonomies(),
    getSearchIndexingOverview(),
  ]);
  const indexedHubs = [...lists, ...taxonomies].filter((item) => item.indexable).length;
  const totalHubs = lists.length + taxonomies.length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Vizibilitate în căutări"
        title="SEO și indexare"
        description="Controlează ce pagini publice intră în sitemap și pot fi descoperite de Google, Bing și alte motoare de căutare."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <ProgressCard label="Cărți publice" indexed={overview.books.indexed} eligible={overview.books.eligible} />
        <ProgressCard label="Autori publici" indexed={overview.authors.indexed} eligible={overview.authors.eligible} />
        <ProgressCard label="Liste și categorii" indexed={indexedHubs} eligible={totalHubs} />
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold">Actualizează sitemap-ul</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Acțiunea include cărțile publicate care au fișa completă și autor public, apoi include profilurile autorilor care au cel puțin o astfel de carte. Ciornele și paginile incomplete rămân excluse.
            </p>
          </div>
          {canManageSeo ? (
            <form action={includePublishedContentInSearchAction}>
              <button className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-white hover:opacity-90">
                Include conținutul public
              </button>
            </form>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          <Link href="/sitemap.xml" target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Deschide sitemap.xml</Link>
          <Link href="/robots.txt" target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Deschide robots.txt</Link>
          <Link href="/admin/settings" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Setări verificare Google/Bing</Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold">Liste și pagini de categorie</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Aceste pagini intră în sitemap numai când au conținut suficient, descriere proprie și sunt marcate pentru indexare.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/taxonomies" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Administrează categoriile</Link>
          <Link href="/admin/lists" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Administrează listele</Link>
        </div>
      </section>
    </>
  );
}
