import { getActiveProvinces } from "./provinces";
import { getDistrictsByProvince } from "./districts";
import { getTaxiStandsByProvince, getTaxiStandsByDistrict } from "./taxi-stands";
import { hasVerifiedTariff } from "./tariffs";
import type { Province } from "../validation/schemas";

/**
 * District/stand totals are never hand-maintained (spec §10.1) — every count here is
 * derived at build time from the same repositories the pages render from, so the
 * homepage total, the province hub total, and the district list can never drift apart.
 */
export type ProvinceWithStats = Province & {
  districtCount: number;
  activeStandCount: number;
  hasVerifiedTariff: boolean;
};

export function getProvinceStats(provinceId: string): {
  districtCount: number;
  activeStandCount: number;
  hasVerifiedTariff: boolean;
} {
  return {
    districtCount: getDistrictsByProvince(provinceId).length,
    activeStandCount: getTaxiStandsByProvince(provinceId).length,
    hasVerifiedTariff: hasVerifiedTariff(provinceId),
  };
}

export function getDistrictStandCount(districtId: string): number {
  return getTaxiStandsByDistrict(districtId).length;
}

export function getAllProvincesWithStats(): ProvinceWithStats[] {
  return getActiveProvinces().map((province) => ({
    ...province,
    ...getProvinceStats(province.id),
  }));
}

export function getSiteWideTotals(): {
  provinceCount: number;
  districtCount: number;
  activeStandCount: number;
  verifiedTariffProvinceCount: number;
} {
  const provinces = getAllProvincesWithStats();
  return {
    provinceCount: provinces.length,
    districtCount: provinces.reduce((sum, p) => sum + p.districtCount, 0),
    activeStandCount: provinces.reduce((sum, p) => sum + p.activeStandCount, 0),
    verifiedTariffProvinceCount: provinces.filter((p) => p.hasVerifiedTariff).length,
  };
}
