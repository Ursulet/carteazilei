import { getPublicEditorialListPage } from "@/db/queries/public-seo-hubs";
import { renderEditorialSocialImage, socialImageContentType, socialImageSize } from "@/lib/seo/social-image";

export const alt = "Listă editorială CarteaZilei";
export const size = socialImageSize;
export const contentType = socialImageContentType;
export const dynamic = "force-dynamic";

export default async function ListOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicEditorialListPage(slug, "list");

  return renderEditorialSocialImage({
    label: "Listă editorială",
    title: page?.list.title ?? "CarteaZilei",
    description: page
      ? `${page.selections.length} selecții argumentate · ${page.list.intro}`
      : "Selecții de cărți construite în jurul unei intenții clare.",
  });
}
