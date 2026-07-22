import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { sourcePath } from "../src/lib/utils/paths";
import {
  loadProvinceBoundaries,
  findBoundaryByIsoCode,
} from "../src/lib/geography/province-boundaries";
import { loadDistrictBoundaries } from "../src/lib/geography/district-boundaries";
import { computeCentroid } from "../src/lib/geography/polygon-centroid";
import { matchDistrictBoundaries } from "../src/lib/geography/match-district-boundaries";
import type { PolygonalGeometry } from "../src/lib/geography/point-in-polygon";

/**
 * One-off (re-runnable) fill-in for the latitude/longitude columns left blank since launch
 * (README §3 assumption) — computed from the real OSM-derived boundary polygons already used
 * for geography validation, never guessed. Only ever writes a coordinate where a genuine
 * geometry match was found; leaves the field blank otherwise rather than approximating.
 *
 * A 100% match rate isn't the expected end state: the upstream source includes at least one
 * feature named "Περιφερειακή Ενότητα Χίου" ("Regional Unit of Chios") — a Greek administrative
 * unit, not a Turkish ilçe — that has no counterpart in districts.csv and never should.
 */
const TODAY = "2026-07-22";

function toCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function round(value: number): string {
  return value.toFixed(6);
}

type CsvRow = Record<string, string>;

function writeCsv(path: string, columns: string[], rows: CsvRow[]): void {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => toCsvField(row[c] ?? "")).join(","));
  }
  writeFileSync(path, lines.join("\n") + "\n", "utf-8");
}

async function main() {
  const provinceColumns = [
    "id",
    "name",
    "slug",
    "plateCode",
    "officialCode",
    "region",
    "latitude",
    "longitude",
    "landlineAreaCodes",
    "status",
    "createdAt",
    "updatedAt",
  ];
  const districtColumns = [
    "id",
    "provinceId",
    "name",
    "slug",
    "officialCode",
    "formerNames",
    "latitude",
    "longitude",
    "status",
    "createdAt",
    "updatedAt",
  ];

  const provinceRows = parse(readFileSync(sourcePath("provinces.csv"), "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  const districtRows = parse(readFileSync(sourcePath("districts.csv"), "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  const provinceBoundaries = await loadProvinceBoundaries();
  const districtBoundaries = await loadDistrictBoundaries();

  if (!provinceBoundaries || !districtBoundaries) {
    console.error("Sınır verisi yüklenemedi — hiçbir koordinat yazılmadı.");
    process.exit(1);
  }

  const provinceGeometryById = new Map<string, PolygonalGeometry>();
  let provinceMatched = 0;
  for (const row of provinceRows) {
    const boundary = findBoundaryByIsoCode(provinceBoundaries, row.officialCode!);
    if (!boundary) continue;
    provinceGeometryById.set(row.id!, boundary.geometry);
    const [lon, lat] = computeCentroid(boundary.geometry);
    row.latitude = round(lat);
    row.longitude = round(lon);
    row.updatedAt = TODAY;
    provinceMatched++;
  }

  const districtRowById = new Map(districtRows.map((row) => [row.id!, row]));
  const { geometryByDistrictId, tierByDistrictId, unmatchedBoundaries } = matchDistrictBoundaries(
    districtRows.map((row) => ({ id: row.id!, provinceId: row.provinceId!, name: row.name! })),
    provinceRows.map((row) => ({ id: row.id!, name: row.name!, plateCode: Number(row.plateCode) })),
    districtBoundaries,
    provinceGeometryById,
  );

  let districtMatched = 0;
  const matchedViaTier = new Map<string, number>();
  for (const [districtId, geometry] of geometryByDistrictId) {
    const row = districtRowById.get(districtId);
    if (!row) continue;
    const [lon, lat] = computeCentroid(geometry);
    row.latitude = round(lat);
    row.longitude = round(lon);
    row.updatedAt = TODAY;
    districtMatched++;
    const tier = tierByDistrictId.get(districtId)!;
    matchedViaTier.set(tier, (matchedViaTier.get(tier) ?? 0) + 1);
  }

  writeCsv(sourcePath("provinces.csv"), provinceColumns, provinceRows);
  writeCsv(sourcePath("districts.csv"), districtColumns, districtRows);

  console.log(`İl: ${provinceMatched}/${provinceRows.length} eşleşti ve koordinat yazıldı.`);
  console.log(`İlçe: ${districtMatched}/${districtRows.length} eşleşti ve koordinat yazıldı.`);
  console.log("\nEşleşme yöntemine göre dağılım:");
  for (const [tier, count] of [...matchedViaTier.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(3, " ")}  ${tier}`);
  }

  if (unmatchedBoundaries.length > 0) {
    console.log(`\nEşleşmeyen ${unmatchedBoundaries.length} sınır özelliği (koordinat yazılmadı):`);
    for (const boundary of unmatchedBoundaries) {
      console.log(`  plaka=${boundary.plateCode ?? "(yok)"}  isim="${boundary.name}"`);
    }
  }
}

main();
