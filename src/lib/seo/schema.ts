import type { JsonLdValue } from "./json-ld";
import { absolutePublicUrl } from "./urls";

export type StructuredBreadcrumb = { name: string; path: string };

export function organizationWebsiteJsonLd({ name = "Cartea Zilei", logoPath = "/og.png" }: { name?: string; logoPath?: string } = {}): JsonLdValue {
  const home = absolutePublicUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${home}#organization`,
        name,
        url: home,
        logo: absolutePublicUrl(logoPath),
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        url: home,
        name,
        inLanguage: "ro-RO",
        publisher: { "@id": `${home}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absolutePublicUrl("/cauta")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: StructuredBreadcrumb[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolutePublicUrl(item.path),
    })),
  };
}

export function itemListJsonLd({ name, path, items }: { name: string; path: string; items: { name: string; path: string }[] }): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absolutePublicUrl(path)}#item-list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absolutePublicUrl(item.path),
    })),
  };
}

type ProfilePageSchemaInput = {
  name: string;
  description?: string | null;
  path: string;
  dateModified?: Date | null;
  image?: string | null;
  role?: string;
};

export function profilePageJsonLd({ name, description, path, dateModified, image, role }: ProfilePageSchemaInput): JsonLdValue {
  const url = absolutePublicUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: `${name} — profil`,
    description: description || undefined,
    dateModified: dateModified?.toISOString(),
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name,
      description: description || undefined,
      url,
      image: image ? absolutePublicUrl(image) : undefined,
      jobTitle: role || undefined,
    },
  };
}

type BookSchemaInput = {
  path: string;
  title: string;
  alternateTitle?: string | null;
  description: string;
  coverPath: string;
  author: { name: string; path: string };
  isbn?: string | null;
  language: string;
  pageCount?: number | null;
  publicationDate?: string | number | null;
  publisher?: string | null;
  genres: string[];
};

export function bookJsonLd(input: BookSchemaInput): JsonLdValue {
  const url = absolutePublicUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${url}#book`,
    url,
    name: input.title,
    alternateName: input.alternateTitle || undefined,
    description: input.description,
    image: absolutePublicUrl(input.coverPath),
    author: { "@type": "Person", name: input.author.name, url: absolutePublicUrl(input.author.path) },
    isbn: input.isbn || undefined,
    inLanguage: input.language,
    numberOfPages: input.pageCount || undefined,
    datePublished: input.publicationDate?.toString(),
    publisher: input.publisher ? { "@type": "Organization", name: input.publisher } : undefined,
    genre: input.genres,
    mainEntityOfPage: url,
  };
}
