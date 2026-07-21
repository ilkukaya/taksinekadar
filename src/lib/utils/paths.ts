import { join } from "node:path";

/**
 * process.cwd() is reliable here because every entry point (astro dev/build, tsx
 * scripts, vitest) is invoked from the repo root via package.json scripts / CI.
 */
export const PROJECT_ROOT = process.cwd();
export const DATA_SOURCE_DIR = join(PROJECT_ROOT, "data/source");
export const DATA_NORMALIZED_DIR = join(PROJECT_ROOT, "data/normalized");
export const DATA_REPORTS_DIR = join(PROJECT_ROOT, "data/reports");

export function sourcePath(filename: string): string {
  return join(DATA_SOURCE_DIR, filename);
}

export function normalizedPath(filename: string): string {
  return join(DATA_NORMALIZED_DIR, filename);
}

export function reportsPath(filename: string): string {
  return join(DATA_REPORTS_DIR, filename);
}
