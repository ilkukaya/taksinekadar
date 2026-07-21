import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "../src/lib/geography/distance";

describe("haversineDistanceMeters", () => {
  it("returns 0 for identical coordinates", () => {
    const point = { latitude: 41.0082, longitude: 28.9784 };
    expect(haversineDistanceMeters(point, point)).toBe(0);
  });

  it("computes a plausible distance between two well-known points (Taksim to Kadıköy)", () => {
    const taksim = { latitude: 41.037, longitude: 28.985 };
    const kadikoy = { latitude: 40.9906, longitude: 29.0277 };
    const distance = haversineDistanceMeters(taksim, kadikoy);
    // Straight-line distance across the Bosphorus is roughly 7-8 km.
    expect(distance).toBeGreaterThan(6000);
    expect(distance).toBeLessThan(9000);
  });

  it("is symmetric", () => {
    const a = { latitude: 39.9334, longitude: 32.8597 };
    const b = { latitude: 38.4237, longitude: 27.1428 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 5);
  });
});
