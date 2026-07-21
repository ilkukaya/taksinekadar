import { SITE, canonicalUrl } from "../../config/site";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: canonicalUrl(SITE.logoPath),
    description: SITE.description,
  };
}

/**
 * No SearchAction potentialAction on purpose: site search is client-side only and has
 * no server-rendered results URL, so a SearchAction would describe a capability that
 * doesn't exist (spec §26 bans structured data that doesn't match visible/working behavior).
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: SITE.language,
    description: SITE.description,
  };
}
