import { Download, FileSpreadsheet, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthorImportForm } from "@/components/admin/author-import-form";
import { AdminPageHeader, FormSection } from "@/components/admin/editorial-ui";
import { requireMutationAccess } from "@/lib/auth/principal";

import { importAuthorsAction } from "./actions";

export const metadata: Metadata = { title: "Import autori" };

export default async function AuthorImportPage() {
  await requireMutationAccess("authors");

  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Importă autori" description="Fiecare autor primește un identificator stabil. Același identificator introdus în CSV-ul cărților creează automat legătura corectă." />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Step number="1" icon={Download} title="Descarcă modelul" text="Completează câte un autor pe rând și nu modifica numele coloanelor." />
        <Step number="2" icon={FileSpreadsheet} title="Importă autorii" text="Autorii noi sunt creați ca ciorne; profilurile existente nu sunt suprascrise." />
        <Step number="3" icon={Link2} title="Importă cărțile" text="Folosește identificator_autor pentru asocierea exactă, fără potriviri aproximative după nume." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Fișierul-model" description="CSV UTF-8 compatibil cu Excel, cu separator punct și virgulă.">
          <Link href="/admin/authors/import/template" className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft"><Download aria-hidden="true" className="me-2 size-4" />Descarcă modelul CSV</Link>
          <div className="mt-5 rounded-xl bg-paper p-4 text-xs leading-6 text-muted">
            <strong className="text-foreground">Exemplu:</strong> autorul are identificatorul <code>autor-exemplu</code>. În modelul pentru cărți vei introduce aceeași valoare în coloana <code>identificator_autor</code>.
          </div>
        </FormSection>

        <FormSection title="Importă lista de autori" description="Dacă numele sau slugul există deja, importul atașează identificatorul profilului existent fără să-i schimbe biografia.">
          <AuthorImportForm action={importAuthorsAction} />
        </FormSection>
      </div>
    </>
  );
}

function Step({ number, icon: Icon, title, text }: { number: string; icon: typeof Download; title: string; text: string }) {
  return <div className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center gap-3"><span className="inline-flex size-10 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">{number}</span><Icon aria-hidden="true" className="size-5 text-rust" /></div><h2 className="mt-4 font-display text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>;
}
