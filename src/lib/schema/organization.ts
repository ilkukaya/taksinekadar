import { SITE, canonicalUrl } from "../../config/site";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: SITE.namePlain,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: canonicalUrl("/icons/icon-512.png"),
      width: 512,
      height: 512,
    },
    description: SITE.description,
    email: SITE.contactEmail,
    areaServed: { "@type": "Country", name: "Türkiye" },
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
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    alternateName: SITE.namePlain,
    publisher: { "@id": `${SITE.url}/#organization` },
    url: SITE.url,
    inLanguage: SITE.language,
    description: SITE.description,
  };
}
