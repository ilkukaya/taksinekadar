import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getActiveProvinces } from "../src/lib/repositories/provinces";
import { getActiveAirports } from "../src/lib/repositories/airports";
import { getActiveBusTerminals } from "../src/lib/repositories/bus-terminals";
import { getDistrictsByProvince } from "../src/lib/repositories/districts";
import { getTaxiStandsByDistrict } from "../src/lib/repositories/taxi-stands";
import { PROJECT_ROOT } from "../src/lib/utils/paths";

/**
 * Build-time search index for the client-side SearchBox component. Only entities with a
 * real, live page get an entry here. Individual taxi stands (thousands of them) are NOT
 * indexed individually — their district's durak listing page is the right search
 * granularity and already links every stand it covers.
 */
type SearchIndexItem = {
  name: string;
  type: "il" | "havalimani" | "otogar" | "ilce";
  path: string;
  province?: string;
};

function buildSearchIndex(): SearchIndexItem[] {
  const provinces = getActiveProvinces();
  const provinceNameById = new Map(provinces.map((p) => [p.id, p.name]));
  const provinceSlugById = new Map(provinces.map((p) => [p.id, p.slug]));

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

  const districtItems: SearchIndexItem[] = provinces.flatMap((p) =>
    getDistrictsByProvince(p.id)
      .filter((d) => getTaxiStandsByDistrict(d.id).length > 0)
      .map((d) => ({
        name: d.name,
        type: "ilce" as const,
        path: `/${provinceSlugById.get(p.id)}/${d.slug}/taksi-duraklari/`,
        province: p.name,
      })),
  );

  return [...provinceItems, ...airportItems, ...busTerminalItems, ...districtItems];
}

function main() {
  const index = buildSearchIndex();
  const outPath = join(PROJECT_ROOT, "public/search-index.json");
  writeFileSync(outPath, JSON.stringify(index), "utf-8");
  console.log(`search-index.json yazıldı: ${index.length} kayıt → ${outPath}`);
}

main();
