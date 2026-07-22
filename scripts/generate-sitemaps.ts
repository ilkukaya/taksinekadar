import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SITE, canonicalUrl } from "../src/config/site";
import { getActiveProvinces } from "../src/lib/repositories/provinces";
import { getAllActiveTariffsForProvince } from "../src/lib/repositories/tariffs";
import { getActiveAirports } from "../src/lib/repositories/airports";
import { getActiveBusTerminals } from "../src/lib/repositories/bus-terminals";
import { getActivePopularRoutes } from "../src/lib/repositories/popular-routes";
import { getDistrictsByProvince } from "../src/lib/repositories/districts";
import {
  getTaxiStandsByDistrict,
  getTaxiStandsByProvince,
} from "../src/lib/repositories/taxi-stands";
import { getAllGuidesFromDisk } from "../src/lib/content/guides-fs";
import { PROJECT_ROOT } from "../src/lib/utils/paths";

type SitemapUrl = { loc: string; lastmod?: string };

/**
 * Only 200/canonical/indexable/real-content URLs are ever written here (spec §25) — the
 * tariff-page filter below intentionally mirrors the exact noindex condition used by
 * [provinceTariffSlug].astro, so the two can never silently drift apart.
 */
function buildUrlset(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildSitemapIndex(sitemapFiles: string[]): string {
  const body = sitemapFiles
    .map((file) => `  <sitemap>\n    <loc>${SITE.url}/sitemaps/${file}</loc>\n  </sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

function main() {
  const distDir = join(PROJECT_ROOT, "dist");
  const sitemapsDir = join(distDir, "sitemaps");
  if (!existsSync(distDir)) {
    console.error("dist/ bulunamadı — önce `astro build` çalıştırılmalı.");
    process.exit(1);
  }
  mkdirSync(sitemapsDir, { recursive: true });

  const pageUrls: SitemapUrl[] = [
    { loc: canonicalUrl("/") },
    { loc: canonicalUrl("/taksi-ucreti-hesaplama/") },
    { loc: canonicalUrl("/iller/") },
    { loc: canonicalUrl("/tarifeler/") },
    { loc: canonicalUrl("/havalimani/") },
    { loc: canonicalUrl("/otogar/") },
    { loc: canonicalUrl("/rota/") },
    { loc: canonicalUrl("/taksi-duraklari/") },
    { loc: canonicalUrl("/rehber/") },
    { loc: canonicalUrl("/yasal/veri-kaynaklari/") },
    { loc: canonicalUrl("/yasal/iletisim/") },
  ];

  const provinces = getActiveProvinces();
  const tariffUrls: SitemapUrl[] = provinces
    .map((p) => ({ province: p, tariffs: getAllActiveTariffsForProvince(p.id) }))
    .filter(({ tariffs }) => tariffs.length > 0)
    .map(({ province, tariffs }) => {
      const latest = tariffs.reduce(
        (max, t) => (t.updatedAt > max ? t.updatedAt : max),
        tariffs[0]!.updatedAt,
      );
      return { loc: canonicalUrl(`/${province.slug}-taksi-ucreti/`), lastmod: latest };
    });

  const airportUrls: SitemapUrl[] = [
    { loc: canonicalUrl("/havalimani/") },
    ...getActiveAirports().map((a) => ({
      loc: canonicalUrl(`/havalimani/${a.slug}/`),
      lastmod: a.lastVerifiedAt,
    })),
  ];

  const otogarUrls: SitemapUrl[] = [
    { loc: canonicalUrl("/otogar/") },
    ...getActiveBusTerminals().map((b) => ({
      loc: canonicalUrl(`/otogar/${b.slug}/`),
      lastmod: b.lastVerifiedAt,
    })),
  ];

  const rotaUrls: SitemapUrl[] = [
    { loc: canonicalUrl("/rota/") },
    ...getActivePopularRoutes().map((r) => ({
      loc: canonicalUrl(`/rota/${r.slug}/`),
      lastmod: r.lastVerifiedAt,
    })),
  ];

  const guideUrls: SitemapUrl[] = [
    { loc: canonicalUrl("/rehber/") },
    ...getAllGuidesFromDisk().map((g) => ({
      loc: canonicalUrl(`/rehber/${g.id}/`),
      lastmod: g.data.updatedAt,
    })),
  ];

  const durakUrls: SitemapUrl[] = [{ loc: canonicalUrl("/taksi-duraklari/") }];
  const standUrls: SitemapUrl[] = [];
  for (const province of provinces) {
    if (getTaxiStandsByProvince(province.id).length === 0) continue;
    durakUrls.push({ loc: canonicalUrl(`/${province.slug}/taksi-duraklari/`) });
    for (const district of getDistrictsByProvince(province.id)) {
      const stands = getTaxiStandsByDistrict(district.id);
      if (stands.length === 0) continue;
      const latest = stands.reduce(
        (max, s) => (s.updatedAt > max ? s.updatedAt : max),
        stands[0]!.updatedAt,
      );
      durakUrls.push({
        loc: canonicalUrl(`/${province.slug}/${district.slug}/taksi-duraklari/`),
        lastmod: latest,
      });
      for (const stand of stands) {
        standUrls.push({
          loc: canonicalUrl(`/${province.slug}/${district.slug}/${stand.slug}/`),
          lastmod: stand.updatedAt,
        });
      }
    }
  }

  const sitemaps: Record<string, SitemapUrl[]> = {
    "pages.xml": pageUrls,
    "tariffs.xml": tariffUrls,
    "airports.xml": airportUrls,
    "otogar.xml": otogarUrls,
    "rota.xml": rotaUrls,
    "guides.xml": guideUrls,
    "duraklar.xml": durakUrls,
    "duraklar-detay.xml": standUrls,
  };

  for (const [filename, urls] of Object.entries(sitemaps)) {
    writeFileSync(join(sitemapsDir, filename), buildUrlset(urls), "utf-8");
  }

  writeFileSync(
    join(distDir, "sitemap-index.xml"),
    buildSitemapIndex(Object.keys(sitemaps)),
    "utf-8",
  );

  const total = Object.values(sitemaps).reduce((sum, urls) => sum + urls.length, 0);
  console.log(`Sitemap oluşturuldu: ${Object.keys(sitemaps).length} dosya, toplam ${total} URL.`);
}

main();
