import { readCsv, emptyToUndefined } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { BusTerminalSchema, type BusTerminal } from "../validation/schemas";
import type { CsvRow } from "../utils/csv";

let cache: BusTerminal[] | null = null;

function mapRow(row: CsvRow): BusTerminal {
  return BusTerminalSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    provinceId: row.provinceId,
    districtId: row.districtId,
    address: emptyToUndefined(row.address),
    sourceUrl: emptyToUndefined(row.sourceUrl),
    lastVerifiedAt: row.lastVerifiedAt,
    status: row.status,
  });
}

export function getAllBusTerminals(): BusTerminal[] {
  if (!cache) {
    cache = readCsv(sourcePath("bus-terminals.csv")).map(mapRow);
  }
  return cache;
}

export function getActiveBusTerminals(): BusTerminal[] {
  return getAllBusTerminals().filter((b) => b.status === "active");
}

export function getBusTerminalsByProvince(provinceId: string): BusTerminal[] {
  return getActiveBusTerminals().filter((b) => b.provinceId === provinceId);
}

export function getBusTerminalBySlug(slug: string): BusTerminal | undefined {
  return getAllBusTerminals().find((b) => b.slug === slug);
}

export function resetBusTerminalsCache(): void {
  cache = null;
}
