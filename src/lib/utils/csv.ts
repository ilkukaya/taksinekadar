import { parse } from "csv-parse/sync";
import { readFileSync, existsSync } from "node:fs";

/** Raw CSV row with every column as a trimmed string, ready for entity-specific mapping. */
export type CsvRow = Record<string, string>;

export function readCsv(path: string): CsvRow[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf-8");
  if (!raw.trim()) return [];
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
}

/** In-cell list convention across every CSV in data/source: semicolon-separated, comma stays the column delimiter. */
export function parseListCell(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function parseOptionalNumber(value: string | undefined): number | undefined {
  const cleaned = emptyToUndefined(value);
  if (cleaned === undefined) return undefined;
  const num = Number(cleaned);
  if (Number.isNaN(num)) {
    throw new Error(`Sayısal olmayan değer: "${value}"`);
  }
  return num;
}

export function parseRequiredNumber(value: string | undefined, field: string): number {
  const num = parseOptionalNumber(value);
  if (num === undefined) {
    throw new Error(`Zorunlu sayısal alan boş: ${field}`);
  }
  return num;
}

const TRUE_VALUES = new Set(["true", "1", "evet", "yes"]);

export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  const cleaned = emptyToUndefined(value);
  if (cleaned === undefined) return undefined;
  return parseBoolean(cleaned);
}
