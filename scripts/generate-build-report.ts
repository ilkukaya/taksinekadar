import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { SITE } from "../src/config/site";
import { PROJECT_ROOT } from "../src/lib/utils/paths";
import { getSiteWideTotals } from "../src/lib/repositories/stats";
import { getCurrentTariffs } from "../src/lib/repositories/tariffs";
import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";

const DIST_DIR = join(PROJECT_ROOT, "dist");

function walkHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...walkHtmlFiles(fullPath));
    else if (entry.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

function findDuplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

function main() {
  if (!existsSync(DIST_DIR)) {
    console.error("dist/ bulunamadı — önce `astro build` çalıştırılmalı.");
    process.exit(1);
  }

  const htmlFiles = walkHtmlFiles(DIST_DIR);
  const titles: string[] = [];
  const descriptions: string[] = [];

  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf-8");
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
    const description = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1];
    if (title) titles.push(title);
    if (description) descriptions.push(description);
  }

  const duplicateTitles = findDuplicateValues(titles);
  const duplicateDescriptions = findDuplicateValues(descriptions);

  const totals = getSiteWideTotals();
  const tariffs = getCurrentTariffs();
  const stands = getAllTaxiStands();
  const provincesWithAnyTariff = new Set(
    tariffs
      .filter((t) => t.status === "active" || t.status === "unverified")
      .map((t) => t.provinceId),
  );

  let sitemapFileCount = 0;
  const sitemapsDir = join(DIST_DIR, "sitemaps");
  if (existsSync(sitemapsDir)) sitemapFileCount = readdirSync(sitemapsDir).length;

  const buildDate = new Date().toISOString().slice(0, 10);

  const report = `# Build Raporu — ${buildDate}

- Marka: ${SITE.name}
- Canonical origin: ${SITE.url}
- İl sayısı: ${totals.provinceCount}
- İlçe sayısı: ${totals.districtCount}
- Aktif durak: ${stands.length}
- Kaynağı doğrulanmış tarife sayısı: ${tariffs.filter((t) => t.status === "active").length}
- Kaynağı doğrulanmamış (tahmini/hesaplayıcı) tarife sayısı: ${tariffs.filter((t) => t.status === "unverified").length}
- Hiçbir tarifesi olmayan il: ${totals.provinceCount - provincesWithAnyTariff.size} il
- Toplam HTML sayfa sayısı: ${htmlFiles.length}
- Sitemap dosya sayısı: ${sitemapFileCount}
- Tekrarlanan title sayısı: ${duplicateTitles.length}
- Tekrarlanan description sayısı: ${duplicateDescriptions.length}

${duplicateTitles.length > 0 ? `## Tekrarlanan title'lar\n\n${duplicateTitles.map((t) => `- ${t}`).join("\n")}\n` : ""}
${duplicateDescriptions.length > 0 ? `## Tekrarlanan description'lar\n\n${duplicateDescriptions.map((d) => `- ${d}`).join("\n")}\n` : ""}
`;

  mkdirSync(join(PROJECT_ROOT, "data/reports"), { recursive: true });
  const reportPath = join(PROJECT_ROOT, "data/reports/build-report.md");
  writeFileSync(reportPath, report, "utf-8");

  console.log(report);
  console.log(`Build raporu yazıldı: ${relative(PROJECT_ROOT, reportPath)}`);

  if (duplicateTitles.length > 0 || duplicateDescriptions.length > 0) {
    console.error(
      "Kritik SEO hatası: tekrarlanan title veya description bulundu — build durduruluyor.",
    );
    process.exit(1);
  }
}

main();
