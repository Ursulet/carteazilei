"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { includePublishedContentInSearch } from "@/domain/editorial/search-indexing-service";
import { withAdminNotice } from "@/lib/admin/notice";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function includePublishedContentInSearchAction() {
  const principal = await requireMutationAccess("seo");
  let notice: string;

  try {
    const result = await includePublishedContentInSearch(principal.id);
    notice = `Sitemap actualizat: ${result.books} cărți și ${result.authors} autori publici incluși.`;
  } catch (error) {
    console.error("SEO indexing sync failed", error);
    notice = "Actualizarea sitemap-ului nu a putut fi finalizată.";
  }

  revalidatePath("/admin/seo");
  revalidatePath("/sitemap.xml");
  revalidatePath("/", "layout");
  redirect(withAdminNotice("/admin/seo", notice));
}
