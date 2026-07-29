import { getPublicBookPage } from "@/db/queries/public-book-pages";
import { renderEditorialSocialImage, socialImageContentType, socialImageSize } from "@/lib/seo/social-image";

export const alt = "Recomandare editorială CarteaZilei";
export const size = socialImageSize;
export const contentType = socialImageContentType;
export const dynamic = "force-dynamic";

export default async function BookOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicBookPage(slug);

  return renderEditorialSocialImage({
    label: "Analiză de carte",
    title: page?.book.title ?? "CarteaZilei",
    description: page ? `${page.author.name} · ${page.book.verdict}` : "Recomandări editoriale explicate.",
  });
}
