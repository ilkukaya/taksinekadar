import { readFileSync, existsSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { SITE } from "../src/config/site";
import { PROJECT_ROOT } from "../src/lib/utils/paths";

const DIST_DIR = join(PROJECT_ROOT, "dist");

function walkHtmlFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkHtmlFiles(fullPath));
    } else if (entry.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

/** dist/foo/index.html -> /foo/ ; dist/index.html -> / */
function filePathToUrlPath(filePath: string): string {
  const rel = relative(DIST_DIR, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return "/";
  const withoutIndex = rel.replace(/\/index\.html$/, "/").replace(/\.html$/, "/");
  return `/${withoutIndex}`.replace(/\/+/g, "/");
}

function extractAnchorHrefs(html: string): string[] {
  const matches = html.matchAll(/<a\s[^>]*href="([^"]+)"/g);
  return [...matches].map((m) => m[1]!);
}

function extractRobotsMeta(html: string): string {
  const match = /<meta\s+name="robots"\s+content="([^"]+)"/.exec(html);
  return match?.[1] ?? "index, follow";
}

function normalizeInternalHref(href: string): string | null {
  let path = href;
  if (path.startsWith(SITE.url)) path = path.slice(SITE.url.length);
  if (!path.startsWith("/")) return null; // external, mailto:, tel:, anchor-only, etc.
  const [withoutHash] = path.split("#");
  const [withoutQuery] = withoutHash!.split("?");
  if (!withoutQuery) return "/";
  return withoutQuery.endsWith("/") ? withoutQuery : `${withoutQuery}/`;
}

function main() {
  if (!existsSync(DIST_DIR)) {
    console.error("dist/ bulunamadı — önce `astro build` çalıştırılmalı.");
    process.exit(1);
  }

  const htmlFiles = walkHtmlFiles(DIST_DIR);
  const validPaths = new Set(htmlFiles.map(filePathToUrlPath));

  const brokenLinks: { from: string; to: string }[] = [];
  const incomingLinkCount = new Map<string, number>();
  const pageIsIndexable = new Map<string, boolean>();

  for (const file of htmlFiles) {
    const fromPath = filePathToUrlPath(file);
    const html = readFileSync(file, "utf-8");
    pageIsIndexable.set(fromPath, !extractRobotsMeta(html).includes("noindex"));

    const hrefs = extractAnchorHrefs(html);
    for (const href of hrefs) {
      const normalized = normalizeInternalHref(href);
      if (!normalized) continue;

      if (!validPaths.has(normalized)) {
        brokenLinks.push({ from: fromPath, to: normalized });
        continue;
      }

      incomingLinkCount.set(normalized, (incomingLinkCount.get(normalized) ?? 0) + 1);
    }
  }

  const orphanPages = [...validPaths].filter(
    (path) =>
      path !== "/" && path !== "/404/" && pageIsIndexable.get(path) && !incomingLinkCount.has(path),
  );

  console.log(`İç bağlantı taraması: ${htmlFiles.length} sayfa tarandı.`);

  if (brokenLinks.length > 0) {
    console.error(`\n${brokenLinks.length} kırık iç link bulundu:`);
    for (const link of brokenLinks.slice(0, 50)) {
      console.error(`  ${link.from} -> ${link.to}`);
    }
  }

  if (orphanPages.length > 0) {
    console.error(
      `\n${orphanPages.length} orphan (hiç iç link almayan, indexlenebilir) sayfa bulundu:`,
    );
    for (const page of orphanPages.slice(0, 50)) {
      console.error(`  ${page}`);
    }
  }

  if (brokenLinks.length > 0 || orphanPages.length > 0) {
    console.error("\nKritik iç bağlantı hatası — build durduruluyor.");
    process.exit(1);
  }

  console.log("İç bağlantı denetimi başarılı: kırık link yok, orphan sayfa yok.");
}

main();
