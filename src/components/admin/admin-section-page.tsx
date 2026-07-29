import { LockKeyhole, PencilLine } from "lucide-react";

import {
  canMutateSection,
  type AdminSectionId,
} from "@/lib/auth/access";
import { requireSectionAccess } from "@/lib/auth/principal";

export async function AdminSectionPage({
  sectionId,
  eyebrow,
  title,
  description,
}: {
  sectionId: AdminSectionId;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const principal = await requireSectionAccess(sectionId);
  const canEdit = canMutateSection(principal.roles, sectionId);

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-accent-dark uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            {description}
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            canEdit ? "bg-accent-soft text-brand" : "bg-paper text-muted"
          }`}
        >
          {canEdit ? (
            <PencilLine aria-hidden="true" className="size-3.5" />
          ) : (
            <LockKeyhole aria-hidden="true" className="size-3.5" />
          )}
          {canEdit ? "Acces editorial" : "Doar citire"}
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-7 sm:p-10">
        <h2 className="text-lg font-semibold text-foreground">Structura este pregătită</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Funcțiile CRUD ale acestui modul vor fi adăugate în faza editorială dedicată. Ruta, navigarea și autorizarea server-side sunt deja active.
        </p>
      </section>
    </div>
  );
}

