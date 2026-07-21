import { readCsv, emptyToUndefined, parseRequiredNumber, parseOptionalNumber } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { PopularRouteSchema, type PopularRoute } from "../validation/schemas";
import type { CsvRow } from "../utils/csv";

let cache: PopularRoute[] | null = null;

function mapRow(row: CsvRow): PopularRoute {
  return PopularRouteSchema.parse({
    id: row.id,
    slug: row.slug,
    originName: row.originName,
    destinationName: row.destinationName,
    provinceId: row.provinceId,
    originDistrictId: emptyToUndefined(row.originDistrictId),
    destinationDistrictId: emptyToUndefined(row.destinationDistrictId),
    distanceKm: parseRequiredNumber(row.distanceKm, "distanceKm"),
    estimatedDurationMinutes: parseOptionalNumber(row.estimatedDurationMinutes),
    tollFee: parseOptionalNumber(row.tollFee),
    notes: emptyToUndefined(row.notes),
    sourceType: row.sourceType,
    sourceUrl: emptyToUndefined(row.sourceUrl),
    lastVerifiedAt: row.lastVerifiedAt,
    searchPriority: parseRequiredNumber(row.searchPriority, "searchPriority"),
    status: row.status,
  });
}

export function getAllPopularRoutes(): PopularRoute[] {
  if (!cache) {
    cache = readCsv(sourcePath("popular-routes.csv")).map(mapRow);
  }
  return cache;
}

export function getActivePopularRoutes(): PopularRoute[] {
  return getAllPopularRoutes()
    .filter((r) => r.status === "active")
    .sort((a, b) => b.searchPriority - a.searchPriority);
}

export function getPopularRoutesByProvince(provinceId: string): PopularRoute[] {
  return getActivePopularRoutes().filter((r) => r.provinceId === provinceId);
}

export function getPopularRouteBySlug(slug: string): PopularRoute | undefined {
  return getAllPopularRoutes().find((r) => r.slug === slug);
}

export function resetPopularRoutesCache(): void {
  cache = null;
}
