import type { GeoPosition, GeoPolygonCoordinates, PolygonalGeometry } from "./point-in-polygon";

type RingMoment = { area: number; cx: number; cy: number };

/**
 * Signed area + first moment of a single linear ring via the shoelace formula. Computed on
 * raw lon/lat degrees (not a projected CRS) — a standard, widely-used approximation for a
 * representative "center" point (the same simplification libraries like Turf.js make); it is
 * not meant to be a geodesically exact center of mass.
 */
function ringMoment(ring: GeoPosition[]): RingMoment {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i]!;
    const [x1, y1] = ring[i + 1]!;
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area /= 2;
  if (area === 0) {
    const [fx, fy] = ring[0] ?? [0, 0];
    return { area: 0, cx: fx, cy: fy };
  }
  return { area, cx: cx / (6 * area), cy: cy / (6 * area) };
}

/**
 * A polygon's first ring is always its exterior boundary and every ring after it is always a
 * hole (a structural GeoJSON rule, unlike ring winding direction which real-world data doesn't
 * reliably follow) — so holes are subtracted by ring position, not by the sign of their
 * computed area.
 */
function polygonMoment(coordinates: GeoPolygonCoordinates): RingMoment {
  let totalArea = 0;
  let cx = 0;
  let cy = 0;
  coordinates.forEach((ring, index) => {
    const r = ringMoment(ring);
    const signedArea = index === 0 ? Math.abs(r.area) : -Math.abs(r.area);
    totalArea += signedArea;
    cx += r.cx * signedArea;
    cy += r.cy * signedArea;
  });
  if (totalArea === 0) {
    const [fx, fy] = coordinates[0]?.[0] ?? [0, 0];
    return { area: 0, cx: fx, cy: fy };
  }
  return { area: totalArea, cx: cx / totalArea, cy: cy / totalArea };
}

/**
 * Area-weighted centroid ("center of mass") of a Polygon or MultiPolygon — holes are
 * subtracted and, for MultiPolygon, each part is weighted by its own area — rather than a
 * naive average of vertices, which a detailed coastline would skew toward its zigzaggiest
 * stretch instead of the shape's true center.
 */
export function computeCentroid(geometry: PolygonalGeometry): GeoPosition {
  if (geometry.type === "Polygon") {
    const { cx, cy } = polygonMoment(geometry.coordinates);
    return [cx, cy];
  }

  let totalArea = 0;
  let cx = 0;
  let cy = 0;
  for (const part of geometry.coordinates) {
    const m = polygonMoment(part);
    const weight = Math.abs(m.area);
    totalArea += weight;
    cx += m.cx * weight;
    cy += m.cy * weight;
  }
  if (totalArea === 0) {
    const [fx, fy] = geometry.coordinates[0]?.[0]?.[0] ?? [0, 0];
    return [fx, fy];
  }
  return [cx / totalArea, cy / totalArea];
}
