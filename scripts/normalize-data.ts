import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "csv-stringify/sync";
import { readCsv } from "../src/lib/utils/csv";
import { DATA_SOURCE_DIR, normalizedPath, PROJECT_ROOT } from "../src/lib/utils/paths";

/**
 * Normalizes whitespace/casing in every data/source CSV and writes the result to
 * data/normalized/ (git-ignored — always rebuilt, never hand-edited). Field values are
 * trimmed generically; phone columns additionally get the canonical "0XXX XXX XX XX"
 * display format so hand-entered and imported records read the same way everywhere.
 */
function normalizePhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^90/, "");
  const local = digits.startsWith("0") ? digits : `0${digits}`;
  if (local.length !== 11) return value.trim();
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 9)} ${local.slice(9, 11)}`;
}

const PHONE_COLUMNS = new Set(["phonePrimary", "phoneSecondary"]);

function normalizeFile(filename: string) {
  const rows = readCsv(join(DATA_SOURCE_DIR, filename));
  if (rows.length === 0) return { filename, rowCount: 0 };

  const columns = Object.keys(rows[0]!);
  const normalizedRows = rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const column of columns) {
      const raw = (row[column] ?? "").trim();
      normalized[column] = PHONE_COLUMNS.has(column) && raw ? normalizePhoneDisplay(raw) : raw;
    }
    return normalized;
  });

  const csvOutput = stringify(normalizedRows, { header: true, columns });
  writeFileSync(normalizedPath(filename), csvOutput, "utf-8");
  return { filename, rowCount: normalizedRows.length };
}

function main() {
  mkdirSync(join(PROJECT_ROOT, "data/normalized"), { recursive: true });
  const csvFiles = readdirSync(DATA_SOURCE_DIR).filter((f) => f.endsWith(".csv"));

  const results = csvFiles.map(normalizeFile);
  for (const result of results) {
    console.log(`${result.filename}: ${result.rowCount} satır normalize edildi.`);
  }
}

main();
