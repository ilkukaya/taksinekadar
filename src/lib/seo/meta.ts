import { SITE, canonicalUrl, defaultOgImageUrl } from "../../config/site";

export type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogImagePath?: string;
  ogImageAlt?: string;
  /** "article" for editorial content (rehber), "website" for everything else. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogImage: string;
  ogUrl: string;
  siteName: string;
  locale: string;
  ogImageAlt: string;
  type: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Every page builds its <title>/<meta>/canonical through this function so the brand
 * suffix stays conditional (never force-appended — spec §23 explicitly bans truncated
 * titles from a mandatory suffix) and noindex is always an explicit, page-level choice.
 */
export function buildPageMeta(input: PageMetaInput): PageMeta {
  return {
    title: input.title,
    description: input.description,
    canonical: canonicalUrl(input.path),
    robots: input.noindex
      ? "noindex, follow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    ogImage: input.ogImagePath ? canonicalUrl(input.ogImagePath) : defaultOgImageUrl(),
    ogUrl: canonicalUrl(input.path),
    siteName: SITE.name,
    locale: SITE.locale,
    ogImageAlt: input.ogImageAlt ?? input.title,
    type: input.type ?? "website",
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
  };
}

/** Appends " | Taksi Ne Kadar?" only when it fits within the ~60-char SEO target. */
export function withBrandSuffix(title: string, maxLength = 60): string {
  const withSuffix = `${title} | ${SITE.name}`;
  return withSuffix.length <= maxLength ? withSuffix : title;
}
