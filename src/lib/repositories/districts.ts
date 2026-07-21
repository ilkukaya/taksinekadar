import { readCsv, parseListCell } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { DistrictSchema, type District } from "../validation/schemas";
import type { CsvRow } from "../utils/csv";

let cache: District[] | null = null;

function mapRow(row: CsvRow): District {
  return DistrictSchema.parse({
    id: row.id,
    provinceId: row.provinceId,
    name: row.name,
    slug: row.slug,
    officialCode: row.officialCode,
    formerNames: parseListCell(row.formerNames),
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function getAllDistricts(): District[] {
  if (!cache) {
    const rows = readCsv(sourcePath("districts.csv"));
    cache = rows.map(mapRow);
  }
  return cache;
}

export function getActiveDistricts(): District[] {
  return getAllDistricts().filter((d) => d.status === "active");
}

export function getDistrictsByProvince(provinceId: string): District[] {
  return getActiveDistricts()
    .filter((d) => d.provinceId === provinceId)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function getDistrictBySlug(provinceId: string, slug: string): District | undefined {
  return getAllDistricts().find((d) => d.provinceId === provinceId && d.slug === slug);
}

export function getDistrictById(id: string): District | undefined {
  return getAllDistricts().find((d) => d.id === id);
}

export function resetDistrictsCache(): void {
  cache = null;
}
