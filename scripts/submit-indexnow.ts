import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SITE } from "../src/config/site";
import { PROJECT_ROOT, reportsPath } from "../src/lib/utils/paths";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function collectUrlsFromChangeReport(): string[] | null {
  const changedUrlsPath = reportsPath("changed-urls.json");
  if (!existsSync(changedUrlsPath)) return null;
  const data = JSON.parse(readFileSync(changedUrlsPath, "utf-8")) as { urls: string[] };
  return data.urls;
}

function collectUrlsFromSitemaps(): string[] {
  const sitemapsDir = join(PROJECT_ROOT, "dist/sitemaps");
  if (!existsSync(sitemapsDir)) return [];

  const urls: string[] = [];
  for (const filename of readdirSync(sitemapsDir)) {
    const xml = readFileSync(join(sitemapsDir, filename), "utf-8");
    const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const match of matches) urls.push(match[1]!);
  }
  return urls;
}

async function main() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.log(
      "INDEXNOW_KEY tanımlı değil — IndexNow bildirimi atlanıyor (bu bir hata değildir).",
    );
    return;
  }

  const urlList = collectUrlsFromChangeReport() ?? collectUrlsFromSitemaps();
  if (urlList.length === 0) {
    console.log("Bildirilecek URL bulunamadı.");
    return;
  }

  const body = {
    host: SITE.domain,
    key,
    keyLocation: `${SITE.url}/${key}.txt`,
    urlList,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    console.log(`IndexNow: ${urlList.length} URL gönderildi, durum: ${response.status}`);
    if (!response.ok) {
      const text = await response.text();
      console.error(`IndexNow yanıtı beklenmeyen durum kodu döndürdü: ${text}`);
    }
  } catch (error) {
    console.error(
      "IndexNow bildirimi gönderilemedi:",
      error instanceof Error ? error.message : error,
    );
  }
}

main();
