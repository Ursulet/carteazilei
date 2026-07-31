import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { BulkBookStatusToolbar } from "@/components/admin/bulk-book-status-toolbar";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/editorial-ui";
import { getAdminBooks } from "@/db/queries/admin-editorial";
import { hasPermission } from "@/lib/auth/permissions";
import { requireSectionAccess } from "@/lib/auth/principal";

import { bulkUpdateBookStatusAction, deleteBookAction } from "./actions";

export const metadata: Metadata = { title: "Cărți" };

export default async function BooksPage() {
  const principal = await requireSectionAccess("books");
  const canCreate = hasPermission(principal.permissions, "books.create", principal.isSuperAdmin);
  const canUpdate = hasPermission(principal.permissions, "books.update", principal.isSuperAdmin);
  const canPublish = hasPermission(principal.permissions, "books.publish", principal.isSuperAdmin);
  const canDelete = hasPermission(principal.permissions, "books.delete", principal.isSuperAdmin);
  const canBatch = canUpdate || canPublish;
  const rows = await getAdminBooks();
  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Cărți" description="Opera editorială, edițiile și completitudinea necesară publicării." action={canCreate ? { href: "/admin/books/new", label: "Carte nouă" } : undefined} />
      {canCreate ? <div className="mb-6 flex justify-end"><Link href="/admin/books/import" className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft">Importă din fișier</Link></div> : null}
      {rows.length === 0 ? <EmptyState>Nu există încă nicio carte. Creează autorul, apoi prima înregistrare editorială.</EmptyState> : (
        <>
        {canBatch ? <BulkBookStatusToolbar action={bulkUpdateBookStatusAction} total={rows.length} canPublish={canPublish} canDraft={canUpdate} /> : null}
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr>{canBatch ? <th className="w-12 px-5 py-4"><span className="sr-only">Selectare</span></th> : null}<th className="px-5 py-4">Titlu / autor</th><th className="px-5 py-4">Stare</th><th className="px-5 py-4">Încredere</th><th className="px-5 py-4">Câmpuri lipsă</th><th className="px-5 py-4">Actualizată</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr></thead>
            <tbody>{rows.map((book) => <tr key={book.id} className="border-b border-border/70 align-top last:border-0">{canBatch ? <td className="px-5 py-4"><input data-bulk-selection="book" type="checkbox" form="bulk-book-status-form" name="bookIds" value={book.id} aria-label={`Selectează ${book.title}`} className="size-4 accent-[var(--brand)]" /></td> : null}<td className="px-5 py-4"><Link href={`/admin/books/${book.id}`} className="font-bold text-foreground underline decoration-border underline-offset-4 hover:decoration-brand">{book.title}</Link><span className="mt-1 block text-xs text-muted">{book.author}</span></td><td className="px-5 py-4"><StatusBadge status={book.status} /></td><td className="px-5 py-4 font-semibold">{book.confidence}%</td><td className="max-w-md px-5 py-4">{book.missingFields.length ? <details><summary className="cursor-pointer font-semibold text-danger">{book.missingFields.length} de completat</summary><ul className="mt-2 list-disc space-y-1 ps-5 text-xs text-muted">{book.missingFields.map((field) => <li key={field}>{field}</li>)}</ul></details> : <span className="font-semibold text-brand">Completă</span>}</td><td className="px-5 py-4 text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(book.updatedAt)}</td><td className="px-5 py-4">{canDelete ? <ConfirmDeleteForm action={deleteBookAction.bind(null, book.id)} /> : null}</td></tr>)}</tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
