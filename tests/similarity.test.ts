import { describe, expect, it } from "vitest";
import { similarityRatio } from "../src/lib/utils/similarity";

describe("similarityRatio", () => {
  it("returns 1 for identical strings", () => {
    expect(similarityRatio("Kadıköy Taksi Durağı", "Kadıköy Taksi Durağı")).toBe(1);
  });

  it("is case- and Turkish-character-insensitive", () => {
    expect(similarityRatio("KADIKÖY TAKSİ", "kadıköy taksi")).toBeGreaterThan(0.9);
  });

  it("scores near-duplicates above the 0.85 review threshold", () => {
    expect(
      similarityRatio("Kadıköy Rıhtım Taksi Durağı", "Kadıköy Rıhtım Taksi Duragi"),
    ).toBeGreaterThanOrEqual(0.85);
  });

  it("scores unrelated strings low", () => {
    expect(similarityRatio("Kadıköy Taksi Durağı", "Beşiktaş Otogar")).toBeLessThan(0.5);
  });
});
