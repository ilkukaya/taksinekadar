import { readCsv, parseListCell, parseRequiredNumber } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { ProvinceSchema, type Province } from "../validation/schemas";
import type { CsvRow } from "../utils/csv";

let cache: Province[] | null = null;

function mapRow(row: CsvRow): Province {
  return ProvinceSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    plateCode: parseRequiredNumber(row.plateCode, "plateCode"),
    officialCode: row.officialCode,
    region: row.region,
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    landlineAreaCodes: parseListCell(row.landlineAreaCodes),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function getAllProvinces(): Province[] {
  if (!cache) {
    const rows = readCsv(sourcePath("provinces.csv"));
    cache = rows.map(mapRow).sort((a, b) => a.plateCode - b.plateCode);
  }
  return cache;
}

export function getActiveProvinces(): Province[] {
  return getAllProvinces().filter((p) => p.status === "active");
}

export function getProvinceBySlug(slug: string): Province | undefined {
  return getAllProvinces().find((p) => p.slug === slug);
}

export function getProvinceById(id: string): Province | undefined {
  return getAllProvinces().find((p) => p.id === id);
}

/** Resets the in-memory cache — used by scripts/tests that mutate CSVs mid-process. */
export function resetProvincesCache(): void {
  cache = null;
}
