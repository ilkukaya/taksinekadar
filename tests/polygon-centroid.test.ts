import { describe, expect, it } from "vitest";
import { computeCentroid } from "../src/lib/geography/polygon-centroid";
import type { GeoPolygonCoordinates } from "../src/lib/geography/point-in-polygon";

const SQUARE: GeoPolygonCoordinates = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
];

describe("computeCentroid", () => {
  it("returns the exact center of a simple square", () => {
    const [x, y] = computeCentroid({ type: "Polygon", coordinates: SQUARE });
    expect(x).toBeCloseTo(5, 9);
    expect(y).toBeCloseTo(5, 9);
  });

  it("returns the exact center regardless of ring winding direction", () => {
    const clockwise: GeoPolygonCoordinates = [
      [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
        [0, 0],
      ],
    ];
    const [x, y] = computeCentroid({ type: "Polygon", coordinates: clockwise });
    expect(x).toBeCloseTo(5, 9);
    expect(y).toBeCloseTo(5, 9);
  });

  it("shifts away from an off-center hole", () => {
    // A 10x10 square with a 4x4 hole cut from its bottom-left corner (0,0)-(4,0)-(4,4)-(0,4).
    // Removing mass from the bottom-left should pull the centroid up and to the right of (5,5).
    const withHole: GeoPolygonCoordinates = [
      SQUARE[0]!,
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0],
      ],
    ];
    const [x, y] = computeCentroid({ type: "Polygon", coordinates: withHole });
    expect(x).toBeGreaterThan(5);
    expect(y).toBeGreaterThan(5);
  });

  it("weights a MultiPolygon's parts by their own area", () => {
    const small: GeoPolygonCoordinates = [
      [
        [100, 100],
        [102, 100],
        [102, 102],
        [100, 102],
        [100, 100],
      ],
    ];
    // `small` (2x2 far away at (101,101)) should barely move the centroid off SQUARE's
    // (5,5) center, since SQUARE (10x10) has 25x the area.
    const [x, y] = computeCentroid({ type: "MultiPolygon", coordinates: [SQUARE, small] });
    expect(x).toBeGreaterThan(5);
    expect(x).toBeLessThan(9);
    expect(y).toBeGreaterThan(5);
    expect(y).toBeLessThan(9);
  });
});
