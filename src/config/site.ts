/**
 * Single source of truth for brand, domain and canonical identity.
 * Every canonical URL, sitemap host, structured-data Organization/WebSite block,
 * Open Graph tag, footer brand text, manifest, and IndexNow submission reads from
 * this file — never hardcode "taksinekadar.com" or the brand name elsewhere.
 */
/**
 * Canonical origin. Defaults to the production domain; a build can override it with SITE_URL,
 * and on Netlify it otherwise follows the site's primary URL (Netlify's built-in `URL` build
 * variable) — so until the custom domain is attached, canonicals/sitemaps point at the live
 * *.netlify.app address instead of a domain that doesn't serve the site yet, and they switch
 * to the custom domain automatically on the first build after it becomes primary.
 */
const DEFAULT_ORIGIN = "https://taksinekadar.com";
const env: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env ? process.env : {};
const ORIGIN = (env.SITE_URL || env.URL || DEFAULT_ORIGIN)
  .trim()
  .replace(/^http:\/\//, "https://")
  .replace(/\/+$/, "");

export const SITE = {
  name: "Taksi Ne Kadar?",
  namePlain: "Taksi Ne Kadar",
  slug: "taksinekadar",
  domain: new URL(ORIGIN).host,
  url: ORIGIN,
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
  // Override with PUBLIC_CONTACT_EMAIL until a mailbox/forwarder exists for the domain.
  contactEmail: (env.PUBLIC_CONTACT_EMAIL || "iletisim@taksinekadar.com").trim(),
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
