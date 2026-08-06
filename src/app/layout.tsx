import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";

import { JsonLd } from "@/lib/seo/json-ld";
import { organizationWebsiteJsonLd } from "@/lib/seo/schema";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";

import "./globals.css";

const faviconUrl = "/site-icon?v=cartea-zilei-20260806";

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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    metadataBase: new URL(settings.canonicalHost),
    title: { default: settings.defaultMetaTitle, template: settings.titleTemplate },
    description: settings.defaultMetaDescription,
    icons: { icon: faviconUrl, shortcut: faviconUrl, apple: settings.appleTouchIconAssetId ? `/media/${settings.appleTouchIconAssetId}` : faviconUrl },
    robots: { index: settings.indexingEnabled, follow: settings.indexingEnabled },
    verification: { google: settings.googleSiteVerification ?? undefined, other: settings.bingSiteVerification ? { "msvalidate.01": settings.bingSiteVerification } : undefined },
    openGraph: { type: "website", locale: settings.defaultLanguage === "ro" ? "ro_RO" : settings.defaultLanguage, siteName: settings.siteName, title: settings.defaultMetaTitle, description: settings.defaultMetaDescription, url: "/", images: [{ url: settings.defaultOgAssetId ? `/media/${settings.defaultOgAssetId}` : "/og.png", width: 1200, height: 630, alt: settings.defaultMetaTitle }] },
    twitter: { card: "summary_large_image", title: settings.defaultMetaTitle, description: settings.defaultMetaDescription, images: [{ url: settings.defaultOgAssetId ? `/media/${settings.defaultOgAssetId}` : "/og.png", alt: settings.defaultMetaTitle }] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const settings = await getPublicSiteSettings();
  return (
    <html lang={settings.defaultLanguage} className={`${inter.variable} ${newsreader.variable}`}>
      <body style={{ "--brand": settings.primaryColor, "--accent": settings.accentColor } as CSSProperties}>
        <JsonLd data={organizationWebsiteJsonLd({ name: settings.siteName, logoPath: settings.logoAssetId ? `/media/${settings.logoAssetId}` : "/og.png" })} />
        {children}
      </body>
    </html>
  );
}
