import type { Metadata } from "next";

import { absolutePublicUrl } from "./urls";

type PublicMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  index?: boolean;
  follow?: boolean;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
};

/** Builds one consistent canonical, robots and social metadata contract for public routes. */
export function buildPublicMetadata({
  title,
  description,
  canonical,
  index = true,
  follow = true,
  type = "website",
  image = "/og.png",
  imageAlt = "CarteaZilei — recomandări editoriale de carte",
}: PublicMetadataInput): Metadata {
  const canonicalUrl = absolutePublicUrl(canonical);
  const imageUrl = absolutePublicUrl(image);
  const socialDescription = description.trim().slice(0, 160);

  return {
    title,
    description: socialDescription,
    alternates: { canonical: canonicalUrl },
    robots: {
      index,
      follow,
      googleBot: { index, follow, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      title,
      description: socialDescription,
      type,
      url: canonicalUrl,
      siteName: "CarteaZilei",
      locale: "ro_RO",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
  };
}

export function buildMissingMetadata(entityLabel: string): Metadata {
  return {
    title: `${entityLabel} inexistentă`,
    robots: { index: false, follow: false, nocache: true },
  };
}
