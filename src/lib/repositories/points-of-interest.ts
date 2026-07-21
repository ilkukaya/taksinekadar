import { readCsv, emptyToUndefined, parseListCell } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { PointOfInterestSchema, type PointOfInterest } from "../validation/schemas";
import type { PoiCategory } from "../validation/enums";
import type { CsvRow } from "../utils/csv";

let hospitalCache: PointOfInterest[] | null = null;
let shoppingCenterCache: PointOfInterest[] | null = null;

function mapRow(row: CsvRow, category: PoiCategory): PointOfInterest {
  return PointOfInterestSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category,
    provinceId: row.provinceId,
    districtId: row.districtId,
    address: emptyToUndefined(row.address),
    nearestStandIds: parseListCell(row.nearestStandIds),
    sourceUrl: emptyToUndefined(row.sourceUrl),
    lastVerifiedAt: row.lastVerifiedAt,
    status: row.status,
  });
}

/**
 * Hospitals/shopping centers only ever render a page when a verified taxi-stand
 * relationship exists — spec §18.8 explicitly forbids inferring one from the stand's
 * name alone. An empty CSV here is a correct, honest state, not a bug.
 */
export function getActiveHospitals(): PointOfInterest[] {
  if (!hospitalCache) {
    hospitalCache = readCsv(sourcePath("hospitals.csv")).map((row) => mapRow(row, "hospital"));
  }
  return hospitalCache.filter((h) => h.status === "active" && h.nearestStandIds.length > 0);
}

export function getActiveShoppingCenters(): PointOfInterest[] {
  if (!shoppingCenterCache) {
    shoppingCenterCache = readCsv(sourcePath("shopping-centers.csv")).map((row) =>
      mapRow(row, "shopping-center"),
    );
  }
  return shoppingCenterCache.filter((s) => s.status === "active" && s.nearestStandIds.length > 0);
}

export function resetPointsOfInterestCache(): void {
  hospitalCache = null;
  shoppingCenterCache = null;
}
