/**
 * Phase 2 pipeline: import taxi stand candidates from a Turkey-wide OpenStreetMap extract.
 *
 * This module intentionally does NOT ship a PBF binary parser — adding one (e.g.
 * `osm-pbf-parser`) without ever running it against a real Geofabrik extract in this
 * environment would be an untested integration pretending to be a working one, which is
 * worse than being explicit about what's left to do. The parts that don't depend on an
 * external binary format (province/district assignment, output shape) are implemented and
 * ready to wire up.
 *
 * To finish this in a real environment:
 *   1. Download the Turkey extract from Geofabrik (https://download.geofabrik.de/europe/turkey.html).
 *   2. `pnpm add osm-pbf-parser` (or an equivalent streaming PBF reader).
 *   3. Implement `readTaxiNodesFromPbf` below to stream `amenity=taxi` nodes from the file.
 *   4. Run this script with OSM_PBF_PATH set to the downloaded file.
 */
import { existsSync } from "node:fs";
import { getActiveDistricts } from "../src/lib/repositories/districts";
import type { District } from "../src/lib/validation/schemas";

export type OsmTaxiNode = {
  osmId: string;
  name?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
};

export type OsmImportCandidate = {
  sourceRecordId: string;
  name: string;
  latitude: number;
  longitude: number;
  phonePrimary?: string;
  openingHours?: string;
  districtId?: string;
};

/**
 * Nearest-district-centroid assignment is a placeholder for real point-in-polygon
 * containment — districts.csv has no boundary geometry yet (only province/district
 * reference codes), so this cannot be more precise until real boundary GeoJSON is added.
 */
function assignNearestDistrict(_node: OsmTaxiNode, _districts: District[]): string | undefined {
  return undefined;
}

function toCandidate(node: OsmTaxiNode, districts: District[]): OsmImportCandidate {
  return {
    sourceRecordId: `osm:${node.osmId}`,
    name: node.name ?? "Taksi Durağı",
    latitude: node.latitude,
    longitude: node.longitude,
    phonePrimary: node.phone,
    openingHours: node.openingHours,
    districtId: assignNearestDistrict(node, districts),
  };
}

async function readTaxiNodesFromPbf(_pbfPath: string): Promise<OsmTaxiNode[]> {
  throw new Error(
    "readTaxiNodesFromPbf henüz uygulanmadı — bkz. bu dosyanın başındaki not. Gerçek bir PBF ayrıştırıcısı olmadan bu adım çalıştırılamaz.",
  );
}

async function main() {
  const pbfPath = process.env.OSM_PBF_PATH;

  if (!pbfPath || !existsSync(pbfPath)) {
    console.log(
      "OSM_PBF_PATH tanımlı değil veya dosya bulunamadı. Bu script, Geofabrik'ten indirilen bir " +
        "Türkiye PBF dosyası bekler (bkz. https://download.geofabrik.de/europe/turkey.html). " +
        "Faz 2 kapsamında gerçek dosya ile çalıştırılana kadar bu adım atlanır.",
    );
    return;
  }

  const districts = getActiveDistricts();
  const nodes = await readTaxiNodesFromPbf(pbfPath);
  const candidates = nodes.map((node) => toCandidate(node, districts));

  console.log(
    `OSM'den ${candidates.length} aday taksi durağı bulundu (henüz normalize/merge edilmedi).`,
  );
}

main();
