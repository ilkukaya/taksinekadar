/**
 * Single source of truth for brand, domain and canonical identity.
 * Every canonical URL, sitemap host, structured-data Organization/WebSite block,
 * Open Graph tag, footer brand text, manifest, and IndexNow submission reads from
 * this file — never hardcode "taksinekadar.com" or the brand name elsewhere.
 */
export const SITE = {
  name: "Taksi Ne Kadar?",
  namePlain: "Taksi Ne Kadar",
  slug: "taksinekadar",
  domain: "taksinekadar.com",
  url: "https://taksinekadar.com",
  locale: "tr-TR",
  language: "tr",
  country: "Türkiye",
  slogan: "Binmeden önce ne kadar tutacağını bil.",
  secondarySlogan: "Ücreti hesapla, durağı bul.",
  tagline: "Türkiye'nin taksi ücreti ve taksi durakları rehberi.",
  description:
    "Türkiye taksi ücreti hesaplama, güncel taksi tarifeleri ve taksi durakları rehberi.",
  themeColor: "#f5b700",
  backgroundColor: "#fbfaf7",
  logoPath: "/logo.svg",
  faviconPath: "/favicon.ico",
  defaultOgImagePath: "/og-default.png",
  contactEmail: "iletisim@taksinekadar.com",
} as const;

/** Legacy/competitor brand strings that must never appear in published HTML. */
export const FORBIDDEN_LEGACY_BRAND_TERMS = [
  "Taksi Taksi Taksi",
  "Taksi Kaç Tutar",
  "taksitaksitaksi.com",
  "taksikactutar.com",
] as const;

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

export function absoluteAssetUrl(path: string): string {
  return canonicalUrl(path);
}

export function defaultOgImageUrl(): string {
  return canonicalUrl(SITE.defaultOgImagePath);
}
