import { readCsv, emptyToUndefined, parseRequiredNumber, parseOptionalNumber } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { TariffSchema, type Tariff } from "../validation/schemas";
import type { VehicleType } from "../../config/vehicle-types";
import type { CsvRow } from "../utils/csv";

let currentCache: Tariff[] | null = null;
let historyCache: Tariff[] | null = null;

function mapRow(row: CsvRow): Tariff {
  return TariffSchema.parse({
    id: row.id,
    provinceId: row.provinceId,
    districtId: emptyToUndefined(row.districtId),
    vehicleType: row.vehicleType,
    openingFee: parseRequiredNumber(row.openingFee, "openingFee"),
    pricePerKm: parseRequiredNumber(row.pricePerKm, "pricePerKm"),
    minimumFare: parseRequiredNumber(row.minimumFare, "minimumFare"),
    waitingFeePerMinute: parseOptionalNumber(row.waitingFeePerMinute),
    nightMultiplier: parseOptionalNumber(row.nightMultiplier),
    validFrom: row.validFrom,
    validUntil: emptyToUndefined(row.validUntil),
    sourceName: row.sourceName,
    sourceUrl: emptyToUndefined(row.sourceUrl),
    sourceDocument: emptyToUndefined(row.sourceDocument),
    sourceDate: emptyToUndefined(row.sourceDate),
    lastVerifiedAt: row.lastVerifiedAt,
    confidenceScore: parseRequiredNumber(row.confidenceScore, "confidenceScore"),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function getCurrentTariffs(): Tariff[] {
  if (!currentCache) {
    currentCache = readCsv(sourcePath("tariffs.csv")).map(mapRow);
  }
  return currentCache;
}

/** Superseded tariffs — never deleted, archived with validUntil set (spec §10.5). */
export function getTariffHistory(): Tariff[] {
  if (!historyCache) {
    historyCache = readCsv(sourcePath("tariff-history.csv")).map(mapRow);
  }
  return historyCache;
}

/** The single currently-active, published tariff for a province (+ optional district override). */
export function getActiveTariff(
  provinceId: string,
  vehicleType: VehicleType = "yellow",
  districtId?: string,
): Tariff | undefined {
  const tariffs = getCurrentTariffs().filter(
    (t) => t.provinceId === provinceId && t.vehicleType === vehicleType && t.status === "active",
  );
  if (districtId) {
    const districtTariff = tariffs.find((t) => t.districtId === districtId);
    if (districtTariff) return districtTariff;
  }
  return tariffs.find((t) => !t.districtId);
}

export function getProvisionalTariff(
  provinceId: string,
  vehicleType: VehicleType = "yellow",
): Tariff | undefined {
  return getCurrentTariffs().find(
    (t) =>
      t.provinceId === provinceId && t.vehicleType === vehicleType && t.status === "unverified",
  );
}

export function getAllActiveTariffsForProvince(provinceId: string): Tariff[] {
  return getCurrentTariffs().filter((t) => t.provinceId === provinceId && t.status === "active");
}

export function getTariffHistoryForProvince(provinceId: string): Tariff[] {
  return getTariffHistory()
    .filter((t) => t.provinceId === provinceId)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom));
}

export function hasVerifiedTariff(provinceId: string): boolean {
  return getCurrentTariffs().some((t) => t.provinceId === provinceId && t.status === "active");
}

export function resetTariffsCache(): void {
  currentCache = null;
  historyCache = null;
}
