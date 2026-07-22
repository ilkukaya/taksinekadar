import { describe, expect, it } from "vitest";
import {
  isPointInPolygon,
  isPointInMultiPolygon,
  isPointInGeometry,
} from "../src/lib/geography/point-in-polygon";
import type { GeoPolygonCoordinates } from "../src/lib/geography/point-in-polygon";

// A simple 10x10 square: (0,0) -> (10,0) -> (10,10) -> (0,10) -> (0,0)
const SQUARE: GeoPolygonCoordinates = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
];

// The same square with a 2x2 hole cut out of its center (4,4)-(6,4)-(6,6)-(4,6).
const SQUARE_WITH_HOLE: GeoPolygonCoordinates = [
  SQUARE[0]!,
  [
    [4, 4],
    [6, 4],
    [6, 6],
    [4, 6],
    [4, 4],
  ],
];

describe("isPointInPolygon", () => {
  it("returns true for a point well inside the polygon", () => {
    expect(isPointInPolygon([5, 5], SQUARE)).toBe(true);
  });

  it("returns false for a point well outside the polygon", () => {
    expect(isPointInPolygon([50, 50], SQUARE)).toBe(false);
  });

  it("returns false for a point outside on the same axis", () => {
    expect(isPointInPolygon([-1, 5], SQUARE)).toBe(false);
  });

  it("treats a point inside a hole as outside the polygon", () => {
    expect(isPointInPolygon([5, 5], SQUARE_WITH_HOLE)).toBe(false);
  });

  it("still returns true for a point inside the polygon but outside the hole", () => {
    expect(isPointInPolygon([1, 1], SQUARE_WITH_HOLE)).toBe(true);
  });
});

describe("isPointInMultiPolygon", () => {
  const secondSquare: GeoPolygonCoordinates = [
    [
      [20, 20],
      [30, 20],
      [30, 30],
      [20, 30],
      [20, 20],
    ],
  ];

  it("returns true if the point is in any of the constituent polygons", () => {
    expect(isPointInMultiPolygon([25, 25], [SQUARE, secondSquare])).toBe(true);
    expect(isPointInMultiPolygon([5, 5], [SQUARE, secondSquare])).toBe(true);
  });

  it("returns false if the point is in none of the constituent polygons", () => {
    expect(isPointInMultiPolygon([100, 100], [SQUARE, secondSquare])).toBe(false);
  });
});

describe("isPointInGeometry", () => {
  it("dispatches to isPointInPolygon for Polygon geometries", () => {
    expect(isPointInGeometry([5, 5], { type: "Polygon", coordinates: SQUARE })).toBe(true);
  });

  it("dispatches to isPointInMultiPolygon for MultiPolygon geometries", () => {
    expect(isPointInGeometry([5, 5], { type: "MultiPolygon", coordinates: [SQUARE] })).toBe(true);
  });
});
