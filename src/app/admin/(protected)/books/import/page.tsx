import { Download, FileJson, FileSpreadsheet, Images } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BookImportForm } from "@/components/admin/book-import-form";
import { AdminPageHeader, FormSection } from "@/components/admin/editorial-ui";
import { getBookFormOptions } from "@/db/queries/admin-editorial";
import { requirePermission, requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Import cărți" };

export default async function BookImportPage() {
  await requireSectionAccess("books");
  await requirePermission("books.create");
  await requirePermission("books.update");
  await requirePermission("authors.manage");
  await requirePermission("media.manage");
  const options = await getBookFormOptions();

  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Importă cărți" description="Un singur flux creează sau reutilizează autorii, completează câmpurile formularului de carte și asociază coperțile. Toate cărțile sunt salvate ca ciorne." />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Step number="1" icon={Download} title="Descarcă modelul" text="JSON este recomandat; CSV rămâne disponibil pentru Excel și scraper." />
        <Step number="2" icon={Images} title="Pregătește coperțile" text="Numele fără extensie trebuie să fie identic cu identificatorul coperții." />
        <Step number="3" icon={FileSpreadsheet} title="Pornește un singur import" text="Fișierul creează cărțile și autorii, apoi imaginile sunt asociate automat." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="grid content-start gap-6">
          <FormSection title="Fișiere-model" description="JSON păstrează mai clar relațiile. În CSV, valorile multiple se separă cu |.">
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/books/import/template?format=json" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover"><FileJson aria-hidden="true" className="me-2 size-4" />Model JSON</Link>
              <Link href="/admin/books/import/template" className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft"><Download aria-hidden="true" className="me-2 size-4" />Model CSV</Link>
            </div>
            <div className="mt-5 rounded-xl bg-paper p-4 text-xs leading-6 text-muted">
              <strong className="text-foreground">Relații sigure:</strong> <code>identificator_carte</code>, <code>identificator_autor</code> și <code>identificator_coperta</code> sunt separate. Același autor poate fi folosit de oricâte cărți.
            </div>
          </FormSection>
        </div>

        <FormSection title="Import complet" description="Selectează fișierul și toate imaginile, apoi pornește o singură operațiune. Identificatorii existenți nu sunt suprascriși.">
          <BookImportForm />
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
