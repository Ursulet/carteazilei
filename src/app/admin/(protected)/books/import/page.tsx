import { Download, FileSpreadsheet, Images } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BookImportForm } from "@/components/admin/book-import-form";
import { BulkCoverUpload } from "@/components/admin/bulk-cover-upload";
import { AdminPageHeader, FormSection } from "@/components/admin/editorial-ui";
import { getBookFormOptions } from "@/db/queries/admin-editorial";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission, requireSectionAccess } from "@/lib/auth/principal";

import { importBooksAction } from "./actions";

export const metadata: Metadata = { title: "Import cărți" };

export default async function BookImportPage() {
  const principal = await requireSectionAccess("books");
  await requirePermission("books.create");
  const options = await getBookFormOptions();
  const canUploadMedia = hasPermission(principal.permissions, "media.manage", principal.isSuperAdmin);

  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Importă cărți" description="Poți încărca CSV-ul și coperțile în orice ordine. Identificatorul comun le asociază automat, iar cărțile sunt create ca ciorne pentru verificare." />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Step number="1" icon={Download} title="Descarcă modelul" text="Păstrează numele coloanelor și separatorul punct și virgulă." />
        <Step number="2" icon={Images} title="Pregătește coperțile" text="Numele fiecărei imagini trebuie să corespundă identificatorului din CSV." />
        <Step number="3" icon={FileSpreadsheet} title="Încarcă în orice ordine" text="CSV înainte sau după imagini; primești raport clar pentru fiecare operațiune." />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="grid content-start gap-6">
          <FormSection title="Fișierul-model" description="Model UTF-8 compatibil cu Excel. Valorile multiple, precum genurile, se separă cu |.">
            <Link href="/admin/books/import/template" className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft"><Download aria-hidden="true" className="me-2 size-4" />Descarcă modelul CSV</Link>
            <div className="mt-5 rounded-xl bg-paper p-4 text-xs leading-6 text-muted">
              <strong className="text-foreground">Identificatori:</strong> folosește aceeași valoare în coloana <code>identificator_coperta</code> și în numele imaginii. Pentru legătura cu autorul, copiază în <code>identificator_autor</code> valoarea din <Link href="/admin/authors/import" className="font-bold text-brand underline underline-offset-2">importul autorilor</Link>.
            </div>
          </FormSection>

          {canUploadMedia ? <FormSection title="Coperți în bulk" description="JPEG, PNG, WebP sau AVIF, maximum 5 MB per imagine și 50 de fișiere într-o selecție."><BulkCoverUpload /></FormSection> : <FormSection title="Coperți în bulk" description="Rolul curent nu are permisiunea Media necesară pentru încărcarea imaginilor."><p className="text-sm text-muted">Un administrator poate acorda permisiunea „Administrare Media” sau poate încărca imaginile în numele tău.</p></FormSection>}
        </div>

        <FormSection title="Importă catalogul" description="Fișierul este validat înainte de prima creare. Un ISBN sau un slug deja existent este omis, nu suprascris.">
          <BookImportForm action={importBooksAction} />
        </FormSection>
      </div>

      <FormSection title="Valorile acceptate pentru taxonomii" description="În CSV poți folosi numele afișate mai jos. Valorile necunoscute opresc importul și sunt indicate în raport.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <TaxonomyList title="Genuri" values={options.genres.map((item) => item.name)} />
          <TaxonomyList title="Teme" values={options.themes.map((item) => item.name)} />
          <TaxonomyList title="Atmosfere" values={options.moods.map((item) => item.name)} />
          <TaxonomyList title="Audiențe" values={options.audiences.map((item) => item.name)} />
        </div>
      </FormSection>
    </>
  );
}

function Step({ number, icon: Icon, title, text }: { number: string; icon: typeof Download; title: string; text: string }) {
  return <div className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center gap-3"><span className="inline-flex size-10 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">{number}</span><Icon aria-hidden="true" className="size-5 text-rust" /></div><h2 className="mt-4 font-display text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>;
}

function TaxonomyList({ title, values }: { title: string; values: string[] }) {
  return <div><h3 className="text-sm font-bold">{title}</h3>{values.length ? <div className="mt-3 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="rounded-full bg-paper px-3 py-1 text-xs text-muted">{value}</span>)}</div> : <p className="mt-2 text-xs text-muted">Nu există încă valori.</p>}</div>;
}
