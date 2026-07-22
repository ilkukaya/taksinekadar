import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT } from "../utils/paths";
import type { PolygonalGeometry } from "./point-in-polygon";

/**
 * Real district (ilçe) boundary polygons from the same source as province-boundaries.ts
 * (OpenStreetMap via geojsons-of-turkey, ODbL) — see /yasal/veri-kaynaklari/ for attribution.
 * There's no ISO code for Turkish districts, so the join key is the OSM "network" tag
 * ("TR{plateCode}-districts", "-counties", or "-provinces" depending on how each province's
 * data was tagged upstream) plus the district's own name; a handful of features (mostly in
 * Iğdır) have no network tag at all and are returned with plateCode left undefined — callers
 * needing those must fall back to an unambiguous name-only match, never a guess.
 */
const BOUNDARY_SOURCE_URL =
  "https://media.githubusercontent.com/media/izzetkalic/geojsons-of-turkey/master/geojsons/turkey-admin-level-6.geojson";
const CACHE_DIR = join(PROJECT_ROOT, "data/raw");
const CACHE_PATH = join(CACHE_DIR, "turkey-districts-boundary.geojson");
const FETCH_TIMEOUT_MS = 60_000;
const NETWORK_PATTERN = /^TR-?(\d+)-(districts|counties|provinces)$/;

export type DistrictBoundary = {
  /** Zero-padded plate code (e.g. "42"), or undefined if the source feature had no parseable network tag. */
  plateCode: string | undefined;
  name: string;
  geometry: PolygonalGeometry;
};

type GeoJsonFeatureCollection = {
  features: Array<{
    properties: Record<string, string | undefined>;
    geometry: PolygonalGeometry;
  }>;
};

let cachedBoundaries: DistrictBoundary[] | null = null;

async function downloadBoundaries(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(BOUNDARY_SOURCE_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Beklenmeyen durum kodu: ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadDistrictBoundaries(): Promise<DistrictBoundary[] | null> {
  if (cachedBoundaries) return cachedBoundaries;

  let raw: string;
  if (existsSync(CACHE_PATH)) {
    raw = readFileSync(CACHE_PATH, "utf-8");
  } else {
    try {
      raw = await downloadBoundaries();
    } catch (error) {
      console.warn(
        `İlçe sınırı verisi indirilemedi (${error instanceof Error ? error.message : error}).`,
      );
      return null;
    }
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_PATH, raw, "utf-8");
  }

  const parsed = JSON.parse(raw) as GeoJsonFeatureCollection;
  cachedBoundaries = parsed.features
    .filter((f) => f.properties["admin_level"] === "6" && f.geometry?.type)
    .map((f) => {
      const match = f.properties.network?.match(NETWORK_PATTERN);
      return {
        plateCode: match ? match[1]!.padStart(2, "0") : undefined,
        name: f.properties.name ?? "",
        geometry: f.geometry,
      };
    });

  return cachedBoundaries;
}
