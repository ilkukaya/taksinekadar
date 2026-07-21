import { readCsv, emptyToUndefined } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { AirportSchema, type Airport } from "../validation/schemas";
import type { CsvRow } from "../utils/csv";

let cache: Airport[] | null = null;

function mapRow(row: CsvRow): Airport {
  return AirportSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    iataCode: emptyToUndefined(row.iataCode),
    provinceId: row.provinceId,
    districtId: row.districtId,
    locationNote: emptyToUndefined(row.locationNote),
    website: emptyToUndefined(row.website),
    sourceUrl: emptyToUndefined(row.sourceUrl),
    lastVerifiedAt: row.lastVerifiedAt,
    status: row.status,
  });
}

export function getAllAirports(): Airport[] {
  if (!cache) {
    cache = readCsv(sourcePath("airports.csv")).map(mapRow);
  }
  return cache;
}

export function getActiveAirports(): Airport[] {
  return getAllAirports().filter((a) => a.status === "active");
}

export function getAirportsByProvince(provinceId: string): Airport[] {
  return getActiveAirports().filter((a) => a.provinceId === provinceId);
}

export function getAirportBySlug(slug: string): Airport | undefined {
  return getAllAirports().find((a) => a.slug === slug);
}

export function resetAirportsCache(): void {
  cache = null;
}
