import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

import { JsonLd } from "@/lib/seo/json-ld";
import { organizationWebsiteJsonLd } from "@/lib/seo/schema";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://carteazilei.ro"),
  title: {
    default: "CarteaZilei — Recomandări de cărți explicate",
    template: "%s | Cartea Zilei",
  },
  description:
    "Recomandări editoriale și personalizate care te ajută să alegi următoarea carte bună.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "CarteaZilei",
    title: "CarteaZilei — Recomandări de cărți explicate",
    description: "Recomandări editoriale și personalizate care te ajută să alegi următoarea carte bună.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "CarteaZilei — următoarea carte bună începe aici" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarteaZilei — Recomandări de cărți explicate",
    description: "Recomandări editoriale și personalizate care te ajută să alegi următoarea carte bună.",
    images: [{ url: "/og.png", alt: "CarteaZilei — următoarea carte bună începe aici" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ro" className={`${inter.variable} ${newsreader.variable}`}>
      <body>
        <JsonLd data={organizationWebsiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
