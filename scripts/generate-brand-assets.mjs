/* global document */
/**
 * Regenerates every raster brand asset from public/logo.svg with a headless Chromium:
 * PWA icons, apple-touch-icon, favicon.ico, the default Open Graph image, and one Open Graph
 * image per province (name only — no prices, so a tariff change never makes a social card
 * stale). Run manually after changing the logo or the OG design, then commit the output:
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Needs a local Chromium (Playwright). Not part of `pnpm build` — Netlify's build image has
 * no browser, and the outputs are static files that rarely change.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pub = (p) => `${root}public/${p}`;

const logoSvg = readFileSync(pub("logo.svg"), "utf8");
const fontB64 = (subset) =>
  readFileSync(
    `${root}node_modules/@fontsource-variable/archivo/files/archivo-${subset}-wght-normal.woff2`,
  ).toString("base64");
const FONT_CSS = `
@font-face{font-family:A;font-weight:100 900;src:url(data:font/woff2;base64,${fontB64("latin")}) format("woff2");unicode-range:U+0000-00FF;}
@font-face{font-family:A;font-weight:100 900;src:url(data:font/woff2;base64,${fontB64("latin-ext")}) format("woff2");unicode-range:U+0100-02AF,U+1E00-1EFF;}
*{margin:0;box-sizing:border-box}body{font-family:A,sans-serif}`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><pattern id="c" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#FFC629"/><rect width="24" height="24" fill="#121417"/><rect x="24" y="24" width="24" height="24" fill="#121417"/></pattern></defs>
  <rect width="512" height="512" fill="#FFC629"/>
  <rect y="364" width="512" height="48" fill="url(#c)"/>
  <g transform="translate(256 250) scale(0.62) translate(-256 -250)">
    <path d="M170 150a86 86 0 1 1 130 74c-28 16-44 28-44 58v4" fill="none" stroke="#121417" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="256" cy="360" r="34" fill="#121417"/>
  </g>
</svg>`;
writeFileSync(pub("icons/icon-maskable.svg"), maskableSvg);

const provinces = readFileSync(`${root}data/source/provinces.csv`, "utf8")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split(","))
  .filter((cols) => cols[9] === "active")
  .map((cols) => ({ name: cols[1], slug: cols[2], plate: cols[3] }));

function ogHtml({ kicker, title, subtitle, plate }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
  body{width:1200px;height:630px;background:#121417;color:#fff;position:relative;overflow:hidden}
  .glow{position:absolute;inset:0;background:radial-gradient(70% 90% at 85% 10%,rgba(255,198,41,.22),transparent 60%)}
  .band{position:absolute;left:0;right:0;bottom:0;height:56px;background:repeating-conic-gradient(#121417 0 25%,#FFC629 0 50%) 0 0/56px 56px}
  .wrap{position:absolute;left:80px;right:80px;top:72px}
  .brand{display:flex;align-items:center;gap:20px;font-size:34px;font-weight:800;letter-spacing:-.02em}
  .brand svg{width:72px;height:72px}
  .kicker{margin-top:64px;color:#FFC629;font-size:28px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
  h1{margin-top:14px;font-size:${title.length > 22 ? 84 : 104}px;line-height:1;font-weight:900;letter-spacing:-.04em;max-width:1000px}
  p{margin-top:26px;font-size:34px;color:#cdd0d4;font-weight:500;max-width:980px;line-height:1.3}
  .plate{position:absolute;right:80px;top:80px;border:4px solid #fff;border-radius:14px;padding:6px 18px 6px 12px;font-size:40px;font-weight:800;display:flex;gap:14px;align-items:center;background:#fff;color:#121417}
  .plate i{font-style:normal;background:#1d4ed8;color:#fff;border-radius:6px;font-size:18px;padding:18px 8px}
  </style></head><body><div class="glow"></div>
  <div class="wrap"><div class="brand">${logoSvg}<span>Taksi Ne Kadar?</span></div>
  <div class="kicker">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div>
  ${plate ? `<div class="plate"><i>TR</i>${String(plate).padStart(2, "0")} TAKSİ</div>` : ""}
  <div class="band"></div></body></html>`;
}

function iconHtml(svg, size) {
  return `<!doctype html><html><head><style>*{margin:0}html,body{width:${size}px;height:${size}px;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`;
}

/** Minimal ICO container embedding PNG images (supported by every modern browser). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const executablePath = existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
  ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
  : undefined;
const browser = await chromium.launch({ executablePath });

async function render(html, width, height, transparent = false, jpeg = false) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot(
    jpeg ? { type: "jpeg", quality: 82 } : { omitBackground: transparent, type: "png" },
  );
  await page.close();
  return buf;
}

// Icons
for (const size of [192, 512]) {
  writeFileSync(
    pub(`icons/icon-${size}.png`),
    await render(iconHtml(logoSvg, size), size, size, true),
  );
  writeFileSync(
    pub(`icons/icon-maskable-${size}.png`),
    await render(iconHtml(maskableSvg, size), size, size),
  );
}
// Apple touch icons must be opaque and square (iOS rounds them itself).
writeFileSync(
  pub("icons/apple-touch-icon.png"),
  await render(iconHtml(maskableSvg, 180), 180, 180),
);
writeFileSync(
  pub("favicon.ico"),
  buildIco([
    { size: 32, data: await render(iconHtml(logoSvg, 32), 32, 32, true) },
    { size: 48, data: await render(iconHtml(logoSvg, 48), 48, 48, true) },
  ]),
);

// Open Graph images
writeFileSync(
  pub("og-default.png"),
  await render(
    ogHtml({
      kicker: "81 il · Güncel tarifeler",
      title: "Taksi ne kadar tutar?",
      subtitle: "Binmeden önce ücreti hesapla, en yakın taksi durağını bul.",
    }),
    1200,
    630,
  ),
);

mkdirSync(pub("og"), { recursive: true });
for (const p of provinces) {
  writeFileSync(
    pub(`og/${p.slug}.jpg`),
    await render(
      ogHtml({
        kicker: "Güncel tarife · Ücret hesaplama",
        title: `${p.name} taksi ücreti`,
        subtitle: `${p.name} açılış, km ve indi-bindi ücreti; taksi durakları ve tahmini yolculuk hesabı.`,
        plate: p.plate,
      }),
      1200,
      630,
      false,
      true,
    ),
  );
}

await browser.close();
console.log(`Brand assets written (${provinces.length} province OG images).`);
