import { readCsv, emptyToUndefined, parseBoolean, parseRequiredNumber } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { TaxiStandSchema, OverrideSchema, type TaxiStand } from "../validation/schemas";
import { PUBLIC_TAXI_STAND_STATUSES, type TaxiStandStatus } from "../validation/enums";
import type { CsvRow } from "../utils/csv";

let cache: TaxiStand[] | null = null;

function mapRow(row: CsvRow): TaxiStand {
  return TaxiStandSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    provinceId: row.provinceId,
    districtId: row.districtId,
    neighborhood: emptyToUndefined(row.neighborhood),
    address: emptyToUndefined(row.address),
    phonePrimary: emptyToUndefined(row.phonePrimary),
    phoneSecondary: emptyToUndefined(row.phoneSecondary),
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    openingHours: emptyToUndefined(row.openingHours),
    is24Hours: row.is24Hours ? parseBoolean(row.is24Hours) : undefined,
    website: emptyToUndefined(row.website),
    mapQuery: emptyToUndefined(row.mapQuery),
    sourceType: row.sourceType,
    sourceName: row.sourceName,
    sourceUrl: emptyToUndefined(row.sourceUrl),
    sourceRecordId: emptyToUndefined(row.sourceRecordId),
    sourceDate: emptyToUndefined(row.sourceDate),
    lastVerifiedAt: emptyToUndefined(row.lastVerifiedAt),
    confidenceScore: parseRequiredNumber(row.confidenceScore, "confidenceScore"),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    internalNotes: emptyToUndefined(row.internalNotes),
  });
}

/**
 * data/source/overrides.csv lets a human correct/suppress a single imported record
 * without the change being clobbered next time the source is re-imported (spec §12.4).
 */
function applyOverrides(stands: TaxiStand[]): TaxiStand[] {
  const overrideRows = readCsv(sourcePath("overrides.csv"));
  if (overrideRows.length === 0) return stands;

  const overrides = new Map(
    overrideRows.map((row) => [
      row.id,
      OverrideSchema.parse({
        id: row.id,
        name: emptyToUndefined(row.name),
        phonePrimary: emptyToUndefined(row.phonePrimary),
        address: emptyToUndefined(row.address),
        status: emptyToUndefined(row.status),
        delete: parseBoolean(row.delete),
        reason: row.reason,
        verifiedAt: row.verifiedAt,
      }),
    ]),
  );

  const result: TaxiStand[] = [];
  for (const stand of stands) {
    const override = overrides.get(stand.id);
    if (!override) {
      result.push(stand);
      continue;
    }
    if (override.delete) continue;

    result.push({
      ...stand,
      name: override.name ?? stand.name,
      phonePrimary: override.phonePrimary ?? stand.phonePrimary,
      address: override.address ?? stand.address,
      status: (override.status as TaxiStandStatus | undefined) ?? stand.status,
      lastVerifiedAt: override.verifiedAt,
      updatedAt: override.verifiedAt,
    });
  }
  return result;
}

export function getAllTaxiStands(): TaxiStand[] {
  if (!cache) {
    const rows = readCsv(sourcePath("taxi-stands.csv"));
    cache = applyOverrides(rows.map(mapRow));
  }
  return cache;
}

/** Stands eligible to render/index publicly — see spec §19. */
export function getPublicTaxiStands(): TaxiStand[] {
  return getAllTaxiStands().filter((s) => PUBLIC_TAXI_STAND_STATUSES.includes(s.status));
}

export function getTaxiStandsByProvince(provinceId: string): TaxiStand[] {
  return getPublicTaxiStands().filter((s) => s.provinceId === provinceId);
}

export function getTaxiStandsByDistrict(districtId: string): TaxiStand[] {
  return getPublicTaxiStands().filter((s) => s.districtId === districtId);
}

export function getTaxiStandBySlug(districtId: string, slug: string): TaxiStand | undefined {
  return getAllTaxiStands().find((s) => s.districtId === districtId && s.slug === slug);
}

export function resetTaxiStandsCache(): void {
  cache = null;
}
