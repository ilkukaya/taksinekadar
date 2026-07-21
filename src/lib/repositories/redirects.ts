import { readCsv } from "../utils/csv";
import { sourcePath } from "../utils/paths";
import { RedirectSchema, type RedirectRecord } from "../validation/schemas";
import type { CsvRow } from "../utils/csv";

let cache: RedirectRecord[] | null = null;

function mapRow(row: CsvRow): RedirectRecord {
  return RedirectSchema.parse({
    fromPath: row.fromPath,
    toPath: row.toPath,
    statusCode: Number(row.statusCode) as 301 | 302 | 307 | 308,
    reason: row.reason,
    createdAt: row.createdAt,
  });
}

export function getAllRedirects(): RedirectRecord[] {
  if (!cache) {
    cache = readCsv(sourcePath("redirects.csv")).map(mapRow);
  }
  return cache;
}

export function resetRedirectsCache(): void {
  cache = null;
}
