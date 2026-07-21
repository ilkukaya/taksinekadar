import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getActiveProvinces } from "../src/lib/repositories/provinces";
import { getActiveAirports } from "../src/lib/repositories/airports";
import { getActiveBusTerminals } from "../src/lib/repositories/bus-terminals";
import { PROJECT_ROOT } from "../src/lib/utils/paths";

/**
 * Build-time search index for the client-side SearchBox component. Only entities with a
 * real, live page get an entry here — district/stand search will be added once those page
 * types ship (see spec's staged rollout in README), never as a link to a page that doesn't exist yet.
 */
type SearchIndexItem = {
  name: string;
  type: "il" | "havalimani" | "otogar";
  path: string;
  province?: string;
};

function buildSearchIndex(): SearchIndexItem[] {
  const provinces = getActiveProvinces();
  const provinceNameById = new Map(provinces.map((p) => [p.id, p.name]));

  const provinceItems: SearchIndexItem[] = provinces.map((p) => ({
    name: p.name,
    type: "il",
    path: `/${p.slug}-taksi-ucreti/`,
  }));

  const airportItems: SearchIndexItem[] = getActiveAirports().map((a) => ({
    name: a.name,
    type: "havalimani",
    path: `/havalimani/${a.slug}/`,
    province: provinceNameById.get(a.provinceId),
  }));

  const busTerminalItems: SearchIndexItem[] = getActiveBusTerminals().map((b) => ({
    name: b.name,
    type: "otogar",
    path: `/otogar/${b.slug}/`,
    province: provinceNameById.get(b.provinceId),
  }));

  return [...provinceItems, ...airportItems, ...busTerminalItems];
}

function main() {
  const index = buildSearchIndex();
  const outPath = join(PROJECT_ROOT, "public/search-index.json");
  writeFileSync(outPath, JSON.stringify(index), "utf-8");
  console.log(`search-index.json yazıldı: ${index.length} kayıt → ${outPath}`);
}

main();
