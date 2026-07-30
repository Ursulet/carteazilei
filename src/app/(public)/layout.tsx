import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { PublicPageViewTracker } from "@/components/analytics/public-page-view-tracker";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { CookieConsentProvider } from "@/components/privacy/cookie-consent-provider";
import { WhatsAppButton } from "@/components/communication/whatsapp-button";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { getPublicNavigation } from "@/domain/settings/navigation-service";
import { footerNavigation, primaryNavigation } from "@/components/layout/navigation";
import { cookieConsentName, parseCookieConsent } from "@/lib/privacy/consent";

export default async function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [settings, cookieStore, configuredNavigation] = await Promise.all([getPublicSiteSettings(), cookies(), getPublicNavigation()]);
  const headerNavigation = configuredNavigation.header.length ? configuredNavigation.header : [...primaryNavigation];
  const footerLinks = configuredNavigation.footer.length ? configuredNavigation.footer : footerNavigation.map((item) => ({ ...item, groupLabel: "Informații" }));
  const social = [["Facebook", settings.socialFacebook], ["Instagram", settings.socialInstagram], ["TikTok", settings.socialTiktok], ["YouTube", settings.socialYoutube], ["LinkedIn", settings.socialLinkedin], ["X", settings.socialX], ["Goodreads", settings.socialGoodreads]].filter((item): item is [string, string] => Boolean(item[1])).map(([label, href]) => ({ label, href }));
  if (settings.maintenanceEnabled) return <main className="grid min-h-screen place-items-center bg-paper px-5"><section className="max-w-2xl rounded-3xl border border-border bg-surface p-8 text-center shadow-xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">{settings.siteName}</p><h1 className="mt-4 font-display text-4xl font-semibold">{settings.maintenanceTitle}</h1><p className="mt-4 leading-7 text-muted">{settings.maintenanceMessage}</p>{settings.maintenanceEstimatedAt ? <p className="mt-5 text-sm font-semibold">Revenire estimată: {new Intl.DateTimeFormat("ro-RO", { dateStyle: "long", timeStyle: "short", timeZone: settings.timezone }).format(settings.maintenanceEstimatedAt)}</p> : null}</section></main>;
  return (
    <CookieConsentProvider
      initialChoice={parseCookieConsent(cookieStore.get(cookieConsentName)?.value)}
      config={{
        bannerEnabled: settings.cookieBannerEnabled,
        analyticsEnabled: settings.analyticsEnabled,
        title: settings.cookieTitle,
        description: settings.cookieDescription,
      }}
    >
      <div className="flex min-h-screen flex-col">
        <PublicPageViewTracker />
        <SkipLink />
        <SiteHeader siteName={settings.siteName} logoAssetId={settings.logoAssetId} navigation={headerNavigation} recommendationEnabled={settings.featureRecommendation} />
        <main id="continut-principal" className="flex-1">
          {children}
        </main>
        <SiteFooter siteName={settings.siteName} siteTagline={settings.siteTagline} logoAssetId={settings.darkLogoAssetId ?? settings.logoAssetId} navigation={footerLinks} social={social} copyrightText={settings.copyrightText} />
        {settings.featureWhatsApp && settings.whatsappNumber ? <WhatsAppButton config={{ number: settings.whatsappNumber, message: settings.whatsappMessage, label: settings.whatsappLabel, position: settings.whatsappPosition, showDesktop: settings.whatsappShowDesktop, showMobile: settings.whatsappShowMobile, includedPaths: settings.whatsappIncludedPaths ?? [], excludedPaths: settings.whatsappExcludedPaths ?? [], color: settings.whatsappColor, tracking: settings.whatsappTrackingEnabled, scheduleText: typeof settings.whatsappSchedule?.display === "string" ? settings.whatsappSchedule.display : null, onlineMessage: settings.whatsappOnlineMessage, offlineMessage: settings.whatsappOfflineMessage }} /> : null}
      </div>
    </CookieConsentProvider>
  );
}
