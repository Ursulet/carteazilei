export type PublicSiteSettings = {
  siteName: string; shortName: string; siteTagline: string; siteDescription: string; primaryUrl: string; defaultLanguage: string; timezone: string; copyrightText: string | null; legalOperatorName: string | null;
  defaultMetaTitle: string; defaultMetaDescription: string; titleTemplate: string; canonicalHost: string; indexingEnabled: boolean; googleSiteVerification: string | null; bingSiteVerification: string | null;
  logoAssetId: string | null; darkLogoAssetId: string | null; compactLogoAssetId: string | null; faviconAssetId: string | null; appleTouchIconAssetId: string | null; defaultOgAssetId: string | null; bookPlaceholderAssetId: string | null; primaryColor: string; accentColor: string;
  contactEmail: string | null; contactPhone: string | null; contactAddress: string | null;
  socialFacebook: string | null; socialInstagram: string | null; socialTiktok: string | null; socialYoutube: string | null; socialLinkedin: string | null; socialX: string | null; socialGoodreads: string | null;
  affiliateDisclosure: string | null; companyName: string | null; companyTaxId: string | null; companyRegistryNumber: string | null; companyFiscalAddress: string | null; commercialEmail: string | null; partnershipDefaultText: string | null;
  featureRecommendation: boolean; featureDailyArchive: boolean; featureNewsletter: boolean; featureContactForm: boolean; featureWhatsApp: boolean; featureUserReviews: boolean; featurePublicAccounts: boolean; featurePrices: boolean; featureOfferComparison: boolean;
  maintenanceEnabled: boolean; maintenanceTitle: string; maintenanceMessage: string; maintenanceEstimatedAt: Date | null;
  whatsappNumber: string | null; whatsappMessage: string; whatsappLabel: string; whatsappPosition: string; whatsappShowDesktop: boolean; whatsappShowMobile: boolean; whatsappIncludedPaths: string[] | null; whatsappExcludedPaths: string[] | null; whatsappSchedule: Record<string, unknown> | null; whatsappOnlineMessage: string | null; whatsappOfflineMessage: string | null; whatsappColor: string | null; whatsappTrackingEnabled: boolean;
  cookieBannerEnabled: boolean; analyticsEnabled: boolean; cookieTitle: string; cookieDescription: string; privacyControllerName: string; privacyContactEmail: string | null; privacyContactAddress: string | null; privacyRetentionText: string; privacyAdditionalText: string | null;
};
