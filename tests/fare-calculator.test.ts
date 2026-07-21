import { describe, expect, it } from "vitest";
import { calculateFare, buildDistanceReferenceTable } from "../src/lib/calculation/fare-calculator";
import type { Tariff } from "../src/lib/validation/schemas";

const baseTariff: Tariff = {
  id: "test-tariff",
  provinceId: "34",
  vehicleType: "yellow",
  openingFee: 70,
  pricePerKm: 45,
  minimumFare: 200,
  waitingFeePerMinute: 10,
  validFrom: "2026-01-01",
  sourceName: "Test kaynağı",
  lastVerifiedAt: "2026-01-01",
  confidenceScore: 100,
  status: "active",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("calculateFare", () => {
  it("applies the opening fee even at zero distance", () => {
    const result = calculateFare(baseTariff, { distanceKm: 0 });
    // 0 distance -> raw amount is just the opening fee, which is below minimumFare (200).
    expect(result.rawAmount).toBe(70);
    expect(result.estimatedTotal).toBe(200);
    expect(result.minimumFareApplied).toBe(true);
  });

  it("computes distance amount as distanceKm * pricePerKm", () => {
    const result = calculateFare(baseTariff, { distanceKm: 10 });
    expect(result.distanceAmount).toBe(450);
    expect(result.rawAmount).toBe(70 + 450);
    expect(result.estimatedTotal).toBe(520);
    expect(result.minimumFareApplied).toBe(false);
  });

  it("adds waiting time using waitingFeePerMinute", () => {
    const result = calculateFare(baseTariff, { distanceKm: 5, waitingMinutes: 6 });
    expect(result.waitingAmount).toBe(60);
    expect(result.rawAmount).toBe(70 + 225 + 60);
  });

  it("treats a missing waitingFeePerMinute as zero", () => {
    const result = calculateFare(
      { ...baseTariff, waitingFeePerMinute: undefined },
      { distanceKm: 5, waitingMinutes: 30 },
    );
    expect(result.waitingAmount).toBe(0);
  });

  it("adds the extra toll fee on top of the raw amount", () => {
    const result = calculateFare(baseTariff, { distanceKm: 10, extraTollFee: 55.5 });
    expect(result.extraTollFee).toBe(55.5);
    expect(result.rawAmount).toBe(70 + 450 + 55.5);
  });

  it("applies the minimum fare when the raw amount is lower", () => {
    const result = calculateFare(baseTariff, { distanceKm: 1 });
    expect(result.rawAmount).toBe(70 + 45);
    expect(result.estimatedTotal).toBe(200);
    expect(result.minimumFareApplied).toBe(true);
  });

  it("does not apply the minimum fare when the raw amount already exceeds it", () => {
    const result = calculateFare(baseTariff, { distanceKm: 50 });
    expect(result.estimatedTotal).toBe(result.rawAmount);
    expect(result.minimumFareApplied).toBe(false);
  });

  it("handles decimal distances correctly", () => {
    const result = calculateFare(baseTariff, { distanceKm: 3.7 });
    expect(result.distanceAmount).toBeCloseTo(166.5, 5);
  });

  it("handles a very large distance without overflow or precision collapse", () => {
    const result = calculateFare(baseTariff, { distanceKm: 5000 });
    expect(result.distanceAmount).toBe(225_000);
    expect(result.estimatedTotal).toBe(70 + 225_000);
  });

  it("differs correctly per vehicle type tariff", () => {
    const vip: Tariff = {
      ...baseTariff,
      vehicleType: "vip",
      openingFee: 150,
      pricePerKm: 90,
      minimumFare: 400,
    };
    const standard = calculateFare(baseTariff, { distanceKm: 10 });
    const vipResult = calculateFare(vip, { distanceKm: 10 });
    expect(vipResult.estimatedTotal).toBeGreaterThan(standard.estimatedTotal);
  });

  it("reflects a tariff change (new validFrom/prices) in the result", () => {
    const updated: Tariff = {
      ...baseTariff,
      openingFee: 90,
      pricePerKm: 55,
      validFrom: "2026-06-01",
    };
    const result = calculateFare(updated, { distanceKm: 10 });
    expect(result.openingFee).toBe(90);
    expect(result.validFrom).toBe("2026-06-01");
    expect(result.rawAmount).toBe(90 + 550);
  });

  it.each([
    ["negative distance", { distanceKm: -5 }],
    ["negative waiting minutes", { distanceKm: 5, waitingMinutes: -1 }],
    ["negative extra toll fee", { distanceKm: 5, extraTollFee: -10 }],
    ["non-finite distance", { distanceKm: Number.NaN }],
  ])("throws on %s", (_label, input) => {
    expect(() => calculateFare(baseTariff, input)).toThrow();
  });
});

describe("buildDistanceReferenceTable", () => {
  it("returns one row per reference distance in ascending order", () => {
    const rows = buildDistanceReferenceTable(baseTariff);
    expect(rows.map((r) => r.distanceKm)).toEqual([1, 3, 5, 10, 15, 20, 30, 50]);
  });

  it("each row's total matches a direct calculateFare call", () => {
    const rows = buildDistanceReferenceTable(baseTariff);
    const direct = calculateFare(baseTariff, { distanceKm: 15 });
    const row = rows.find((r) => r.distanceKm === 15)!;
    expect(row.estimatedTotal).toBe(direct.estimatedTotal);
  });
});
