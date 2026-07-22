import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT } from "../utils/paths";
import type { PolygonalGeometry } from "./point-in-polygon";

/**
 * Real province boundary polygons sourced from OpenStreetMap (ODbL-licensed) via
 * github.com/izzetkalic/geojsons-of-turkey — see /yasal/veri-kaynaklari/ for attribution.
 * Cached locally on first use (data/raw/, git-ignored) since province borders don't
 * change often enough to justify re-fetching a 12MB file on every validation run.
 * If the source can't be reached, callers get `null` and should fall back to the
 * cheaper national bounding-box check rather than failing the whole pipeline.
 */
const BOUNDARY_SOURCE_URL =
  "https://media.githubusercontent.com/media/izzetkalic/geojsons-of-turkey/master/geojsons/turkey-admin-level-4.geojson";
const CACHE_DIR = join(PROJECT_ROOT, "data/raw");
const CACHE_PATH = join(CACHE_DIR, "turkey-provinces-boundary.geojson");
const FETCH_TIMEOUT_MS = 30_000;

export type ProvinceBoundary = {
  /** Matches Province.officialCode (e.g. "TR-34"). */
  isoCode: string;
  name: string;
  geometry: PolygonalGeometry;
};

type GeoJsonFeatureCollection = {
  features: Array<{
    properties: Record<string, string>;
    geometry: PolygonalGeometry;
  }>;
};

let cachedBoundaries: ProvinceBoundary[] | null = null;

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

export async function loadProvinceBoundaries(): Promise<ProvinceBoundary[] | null> {
  if (cachedBoundaries) return cachedBoundaries;

  let raw: string;
  if (existsSync(CACHE_PATH)) {
    raw = readFileSync(CACHE_PATH, "utf-8");
  } else {
    try {
      raw = await downloadBoundaries();
    } catch (error) {
      console.warn(
        `İl sınırı verisi indirilemedi (${error instanceof Error ? error.message : error}) — bounding-box kontrolüne geri dönülüyor.`,
      );
      return null;
    }
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_PATH, raw, "utf-8");
  }

  const parsed = JSON.parse(raw) as GeoJsonFeatureCollection;
  cachedBoundaries = parsed.features
    .filter(
      (f) => f.properties["admin_level"] === "4" && f.properties["ISO3166-2"]?.startsWith("TR-"),
    )
    .map((f) => ({
      isoCode: f.properties["ISO3166-2"]!,
      name: f.properties.name ?? "",
      geometry: f.geometry,
    }));

  return cachedBoundaries;
}

export function findBoundaryByIsoCode(
  boundaries: ProvinceBoundary[],
  isoCode: string,
): ProvinceBoundary | undefined {
  return boundaries.find((b) => b.isoCode === isoCode);
}
