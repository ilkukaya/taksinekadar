import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { PROJECT_ROOT, reportsPath } from "../src/lib/utils/paths";
import { canonicalUrl } from "../src/config/site";
import { getActiveProvinces } from "../src/lib/repositories/provinces";
import { readCsv } from "../src/lib/utils/csv";

type CsvRow = Record<string, string>;

function readCommittedCsv(relativePath: string): CsvRow[] {
  try {
    const raw = execSync(`git show HEAD:${relativePath}`, { cwd: PROJECT_ROOT, encoding: "utf-8" });
    if (!raw.trim()) return [];
    return parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as CsvRow[];
  } catch {
    return []; // file didn't exist at HEAD (new file) or repo has no commits yet.
  }
}

function diffById(previous: CsvRow[], current: CsvRow[]) {
  const previousById = new Map(previous.map((row) => [row.id, row]));
  const currentById = new Map(current.map((row) => [row.id, row]));

  const added = [...currentById.keys()].filter((id) => !previousById.has(id));
  const removed = [...previousById.keys()].filter((id) => !currentById.has(id));
  const changed = [...currentById.keys()].filter((id) => {
    const prev = previousById.get(id);
    if (!prev) return false;
    const curr = currentById.get(id)!;
    return JSON.stringify(prev) !== JSON.stringify(curr);
  });

  return { added, removed, changed, previousById, currentById };
}

function main() {
  const standsDiff = diffById(
    readCommittedCsv("data/source/taxi-stands.csv"),
    readCsv(join(PROJECT_ROOT, "data/source/taxi-stands.csv")),
  );
  const tariffsDiff = diffById(
    readCommittedCsv("data/source/tariffs.csv"),
    readCsv(join(PROJECT_ROOT, "data/source/tariffs.csv")),
  );

  const phoneChanges = standsDiff.changed.filter((id) => {
    const prev = standsDiff.previousById.get(id)!;
    const curr = standsDiff.currentById.get(id)!;
    return prev.phonePrimary !== curr.phonePrimary || prev.phoneSecondary !== curr.phoneSecondary;
  });

  const addressChanges = standsDiff.changed.filter((id) => {
    const prev = standsDiff.previousById.get(id)!;
    const curr = standsDiff.currentById.get(id)!;
    return prev.address !== curr.address;
  });

  const closedStands = standsDiff.changed.filter((id) => {
    const prev = standsDiff.previousById.get(id)!;
    const curr = standsDiff.currentById.get(id)!;
    return prev.status !== "permanently-closed" && curr.status === "permanently-closed";
  });

  const provinces = getActiveProvinces();
  const provinceBySlugIndex = new Map(provinces.map((p) => [p.id, p]));
  const changedProvinceIds = new Set(
    [...tariffsDiff.added, ...tariffsDiff.changed].map(
      (id) => tariffsDiff.currentById.get(id)!.provinceId,
    ),
  );
  const changedUrls = [...changedProvinceIds]
    .map((id) => provinceBySlugIndex.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p) => canonicalUrl(`/${p.slug}-taksi-ucreti/`));

  const report = `# Veri Değişiklik Raporu — ${new Date().toISOString().slice(0, 10)}

## Taksi Durakları
- Yeni durak: ${standsDiff.added.length}
- Güncellenen durak: ${standsDiff.changed.length}
- Kapanan durak: ${closedStands.length}
- Değişen telefon: ${phoneChanges.length}
- Değişen adres: ${addressChanges.length}
- Silinen kayıt: ${standsDiff.removed.length}

## Tarifeler
- Yeni tarife: ${tariffsDiff.added.length}
- Değişen tarife: ${tariffsDiff.changed.length}
- Silinen tarife kaydı: ${tariffsDiff.removed.length}
- Etkilenen il sayfası: ${changedUrls.length}

## IndexNow için değişen URL'ler
${changedUrls.length > 0 ? changedUrls.map((u) => `- ${u}`).join("\n") : "- (yok)"}
`;

  mkdirSync(join(PROJECT_ROOT, "data/reports"), { recursive: true });
  writeFileSync(reportsPath("change-report.md"), report, "utf-8");
  writeFileSync(
    reportsPath("changed-urls.json"),
    JSON.stringify({ urls: changedUrls }, null, 2),
    "utf-8",
  );

  console.log(report);
}

main();
