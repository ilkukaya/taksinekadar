import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://taksinekadar.com";

/**
 * Sitemap and canonical hosts are generated from this single origin (src/config/site.ts
 * mirrors this value). Internal redirects (renamed districts, moved stand slugs) are
 * sourced from data/source/redirects.csv so the CSV stays the single source of truth
 * instead of duplicating entries here by hand.
 */
function loadRedirects() {
  const csvPath = fileURLToPath(new URL("./data/source/redirects.csv", import.meta.url));
  if (!existsSync(csvPath)) return {};

  const raw = readFileSync(csvPath, "utf-8").trim();
  if (!raw) return {};

  const [headerLine, ...lines] = raw.split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());
  const fromIdx = headers.indexOf("fromPath");
  const toIdx = headers.indexOf("toPath");
  const statusIdx = headers.indexOf("statusCode");

  /** @type {Record<string, string | { status: 301 | 302 | 307 | 308, destination: string }>} */
  const redirects = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const from = cols[fromIdx]?.trim();
    const to = cols[toIdx]?.trim();
    const status = Number(cols[statusIdx]?.trim() || 301);
    if (!from || !to) continue;
    redirects[from] = status === 301 ? to : { status, destination: to };
  }

  return redirects;
}

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  redirects: loadRedirects(),
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
});
