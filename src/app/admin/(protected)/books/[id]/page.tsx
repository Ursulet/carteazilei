import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookForm, type BookFormValues } from "@/components/admin/book-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminBook, getBookFormOptions } from "@/db/queries/admin-editorial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateBookAction } from "../actions";

export const metadata: Metadata = { title: "Editează cartea" };

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("books");
  const { id } = await params;
  const [record, options] = await Promise.all([getAdminBook(id), getBookFormOptions()]);
  if (!record) notFound();
  const values: BookFormValues = {
    title: record.book.title,
    originalTitle: record.book.originalTitle,
    slug: record.book.slug,
    authorId: record.book.primaryAuthorId,
    summary: record.book.spoilerFreeSummary,
    verdict: record.review?.verdict ?? record.book.shortVerdict,
    strengths: record.review?.strengths ?? [],
    caveats: record.review?.caveats ?? [],
    status: record.book.status,
    editorialConfidence: record.book.editorialConfidence,
    editionLabel: record.edition?.editionLabel,
    isbn10: record.edition?.isbn10,
    isbn13: record.edition?.isbn13,
    publisher: record.edition?.publisher,
    publicationYear: record.edition?.publicationYear,
    language: record.edition?.language,
    pageCount: record.edition?.pageCount,
    coverAssetId: record.edition?.coverAssetId,
    editionActive: record.edition?.active ?? true,
    genreIds: record.genreIds,
    themeIds: record.themeIds,
    moodIds: record.moodIds,
    audienceIds: record.audienceIds,
    traitScores: record.traitScores,
    seoTitle: record.seo?.titleOverride,
    seoDescription: record.seo?.descriptionOverride,
    seoCanonical: record.seo?.canonicalOverride,
    seoIndexable: record.seo?.indexable,
  };
  return <><AdminPageHeader eyebrow="Catalog" title={record.book.title} description="Editează fișa și verifică fiecare criteriu înainte să schimbi starea în «Publicată»." /><BookForm action={updateBookAction.bind(null, id)} values={values} options={options} gate={record.gate} bookId={id} /></>;
}
