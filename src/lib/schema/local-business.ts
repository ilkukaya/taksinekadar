import { canonicalUrl } from "../../config/site";
import { formatPhoneForTel } from "../utils/format";
import type { TaxiStand } from "../validation/schemas";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/**
 * Never publish a sahte rating/review (spec §26 explicitly bans AggregateRating for a
 * site with no real review data) — this schema only ever describes fields we can source.
 */
export function buildTaxiStandSchema(
  stand: TaxiStand,
  districtName: string,
  provinceName: string,
  path: string,
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TaxiService"],
    name: stand.name,
    url: canonicalUrl(path),
    address: {
      "@type": "PostalAddress",
      ...(stand.address ? { streetAddress: stand.address } : {}),
      addressLocality: districtName,
      addressRegion: provinceName,
      addressCountry: "TR",
    },
  };

  if (stand.phonePrimary) {
    schema.telephone = formatPhoneForTel(stand.phonePrimary);
  }

  if (stand.latitude !== undefined && stand.longitude !== undefined) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: stand.latitude,
      longitude: stand.longitude,
    };
  }

  // Only asserted when explicitly verified — never assumed (spec §6, §18.5).
  if (stand.is24Hours === true) {
    schema.openingHoursSpecification = {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: WEEK_DAYS,
      opens: "00:00",
      closes: "23:59",
    };
  }

  return schema;
}
