/**
 * Every monetization and measurement integration is configured purely through PUBLIC_*
 * environment variables (set them in Netlify → Site configuration → Environment variables).
 * Anything left unset renders nothing at all — no placeholder IDs, no dead ad boxes, no
 * third-party requests. See docs/YAYIN-VE-GELIR-REHBERI.md for step-by-step setup.
 */
const env = import.meta.env;

const clean = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const ADSENSE_PUB_ID = clean(env.PUBLIC_ADSENSE_PUB_ID);

/**
 * Manual ad units need the numeric "data-ad-slot" id AdSense assigns to each unit you
 * create in the dashboard. Without one, the named placement simply isn't rendered and
 * AdSense Auto Ads (enabled by the publisher id alone) decide placement instead.
 */
export const AD_SLOT_IDS = {
  header: clean(env.PUBLIC_ADSENSE_SLOT_HEADER),
  "after-calculator": clean(env.PUBLIC_ADSENSE_SLOT_AFTER_CALCULATOR),
  "in-content": clean(env.PUBLIC_ADSENSE_SLOT_IN_CONTENT),
  "between-cards": clean(env.PUBLIC_ADSENSE_SLOT_BETWEEN_CARDS),
  sidebar: clean(env.PUBLIC_ADSENSE_SLOT_SIDEBAR),
  footer: clean(env.PUBLIC_ADSENSE_SLOT_FOOTER),
  "mobile-sticky": clean(env.PUBLIC_ADSENSE_SLOT_MOBILE_STICKY),
} as const;

export type AdPlacement = keyof typeof AD_SLOT_IDS;

/** Google Analytics 4 measurement id (G-XXXXXXX). Optional. */
export const GA4_ID = clean(env.PUBLIC_GA4_ID);

/** Cloudflare Web Analytics beacon token — free, cookieless, no consent banner needed. */
export const CF_BEACON_TOKEN = clean(env.PUBLIC_CF_BEACON_TOKEN);

/** Search engine ownership verification meta tags. */
export const VERIFICATION = {
  google: clean(env.PUBLIC_GOOGLE_SITE_VERIFICATION),
  bing: clean(env.PUBLIC_BING_SITE_VERIFICATION),
  yandex: clean(env.PUBLIC_YANDEX_VERIFICATION),
} as const;

/**
 * Affiliate / partner links. Each is a full tracking URL from the partner programme
 * (e.g. an airport-transfer or car-rental affiliate network). Unset → the matching
 * partner card is not rendered anywhere.
 */
export const AFFILIATE = {
  airportTransfer: clean(env.PUBLIC_AFFILIATE_TRANSFER_URL),
  airportTransferName: clean(env.PUBLIC_AFFILIATE_TRANSFER_NAME) ?? "havalimanı transferi",
  carRental: clean(env.PUBLIC_AFFILIATE_CAR_RENTAL_URL),
  carRentalName: clean(env.PUBLIC_AFFILIATE_CAR_RENTAL_NAME) ?? "araç kiralama",
  hotel: clean(env.PUBLIC_AFFILIATE_HOTEL_URL),
  hotelName: clean(env.PUBLIC_AFFILIATE_HOTEL_NAME) ?? "otel",
  busTicket: clean(env.PUBLIC_AFFILIATE_BUS_URL),
  busTicketName: clean(env.PUBLIC_AFFILIATE_BUS_NAME) ?? "otobüs bileti",
} as const;

/** True when at least one cookie-setting third party (ads or GA4) is configured. */
export const USES_THIRD_PARTY_COOKIES = Boolean(ADSENSE_PUB_ID || GA4_ID);
