import type { Tariff } from "../validation/schemas";
import type { VehicleType } from "../../config/vehicle-types";

export type FareCalculationInput = {
  distanceKm: number;
  waitingMinutes?: number;
  extraTollFee?: number;
};

export type FareCalculationResult = {
  provinceId: string;
  vehicleType: VehicleType;
  openingFee: number;
  pricePerKm: number;
  distanceKm: number;
  distanceAmount: number;
  waitingMinutes: number;
  waitingFeePerMinute: number;
  waitingAmount: number;
  extraTollFee: number;
  minimumFare: number;
  minimumFareApplied: boolean;
  rawAmount: number;
  estimatedTotal: number;
  validFrom: string;
  lastVerifiedAt: string;
  sourceName: string;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertNonNegativeFinite(value: number, fieldLabel: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldLabel} geçerli bir sayı olmalı`);
  }
  if (value < 0) {
    throw new Error(`${fieldLabel} negatif olamaz`);
  }
}

/**
 * Pure client-side taxi fare estimate — see spec §16. Never fetches anything and never
 * persists the input; the caller (a browser-only island component) is responsible for
 * not logging or storing what the user types.
 */
export function calculateFare(tariff: Tariff, input: FareCalculationInput): FareCalculationResult {
  const distanceKm = input.distanceKm;
  const waitingMinutes = input.waitingMinutes ?? 0;
  const extraTollFee = input.extraTollFee ?? 0;

  assertNonNegativeFinite(distanceKm, "Mesafe");
  assertNonNegativeFinite(waitingMinutes, "Bekleme süresi");
  assertNonNegativeFinite(extraTollFee, "Ek geçiş ücreti");

  const waitingFeePerMinute = tariff.waitingFeePerMinute ?? 0;
  const distanceAmount = round2(distanceKm * tariff.pricePerKm);
  const waitingAmount = round2(waitingMinutes * waitingFeePerMinute);
  const rawAmount = round2(tariff.openingFee + distanceAmount + waitingAmount + extraTollFee);
  const estimatedTotal = Math.max(rawAmount, tariff.minimumFare);

  return {
    provinceId: tariff.provinceId,
    vehicleType: tariff.vehicleType,
    openingFee: tariff.openingFee,
    pricePerKm: tariff.pricePerKm,
    distanceKm,
    distanceAmount,
    waitingMinutes,
    waitingFeePerMinute,
    waitingAmount,
    extraTollFee,
    minimumFare: tariff.minimumFare,
    minimumFareApplied: estimatedTotal > rawAmount,
    rawAmount,
    estimatedTotal,
    validFrom: tariff.validFrom,
    lastVerifiedAt: tariff.lastVerifiedAt,
    sourceName: tariff.sourceName,
  };
}

/** Reference table rows (1, 3, 5, 10, 15, 20, 30, 50 km) used on province tariff pages — spec §18.2. */
export const REFERENCE_DISTANCES_KM = [1, 3, 5, 10, 15, 20, 30, 50] as const;

export function buildDistanceReferenceTable(tariff: Tariff): FareCalculationResult[] {
  return REFERENCE_DISTANCES_KM.map((distanceKm) => calculateFare(tariff, { distanceKm }));
}
