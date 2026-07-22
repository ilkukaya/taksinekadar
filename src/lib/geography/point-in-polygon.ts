/** GeoJSON position: [longitude, latitude] — note the lon/lat order, opposite of our schema's {latitude, longitude}. */
export type GeoPosition = [number, number];
export type GeoPolygonCoordinates = GeoPosition[][];
export type GeoMultiPolygonCoordinates = GeoPolygonCoordinates[];

export type PolygonGeometry = { type: "Polygon"; coordinates: GeoPolygonCoordinates };
export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: GeoMultiPolygonCoordinates;
};
export type PolygonalGeometry = PolygonGeometry | MultiPolygonGeometry;

/** Standard ray-casting point-in-ring test. */
function isPointInRing(point: GeoPosition, ring: GeoPosition[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

/** A point inside a hole is outside the polygon — GeoJSON's first ring is the exterior, the rest are holes. */
export function isPointInPolygon(point: GeoPosition, coordinates: GeoPolygonCoordinates): boolean {
  const [exteriorRing, ...holes] = coordinates;
  if (!exteriorRing || !isPointInRing(point, exteriorRing)) return false;
  return !holes.some((hole) => isPointInRing(point, hole));
}

export function isPointInMultiPolygon(
  point: GeoPosition,
  coordinates: GeoMultiPolygonCoordinates,
): boolean {
  return coordinates.some((polygon) => isPointInPolygon(point, polygon));
}

export function isPointInGeometry(point: GeoPosition, geometry: PolygonalGeometry): boolean {
  return geometry.type === "Polygon"
    ? isPointInPolygon(point, geometry.coordinates)
    : isPointInMultiPolygon(point, geometry.coordinates);
}
