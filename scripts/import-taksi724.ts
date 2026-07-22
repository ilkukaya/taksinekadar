import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { join } from "node:path";
import { PROJECT_ROOT } from "../src/lib/utils/paths";
import { sourcePath } from "../src/lib/utils/paths";

/**
 * One-off importer for a user-supplied export of taksi724.com's taxi-stand directory
 * (data/raw/taksi724-duraklari-kaynak.csv, gitignored — re-run this script if that file
 * is replaced/updated). Never invents province/district assignments: two rows in the
 * source disagreed with our own geography data, and both are resolved below with an
 * explicit, documented reason rather than silently trusted or silently dropped.
 */
const RAW_PATH = join(PROJECT_ROOT, "data/raw/taksi724-duraklari-kaynak.csv");
const OUTPUT_PATH = sourcePath("taxi-stands.csv");
const TODAY = "2026-07-22";

/** taksi724.com still uses İstanbul's pre-2019 "Eyüp" name; our districts.csv has it as "eyupsultan". */
const DISTRICT_SLUG_ALIASES: Record<string, string> = {
  "34::eyup": "eyupsultan",
};

/**
 * The single "istanbul/kahramankazan" row's own adres field says "...Kazan, Ankara" —
 * Kahramankazan is genuinely an Ankara district (06-kahramankazan), not İstanbul. Source
 * mislabel, corrected here with the row's own address as evidence, not guessed.
 */
const PROVINCE_DISTRICT_CORRECTIONS: Record<string, { il: string; ilce: string }> = {
  "istanbul::kahramankazan": { il: "ankara", ilce: "kahramankazan" },
};

type SourceRow = {
  il: string;
  ilce: string;
  sayfa_basligi: string;
  durak_adi: string;
  telefon: string;
  telefon_normalize: string;
  adres: string;
  detay_link: string;
  kaynak_url: string;
};

type Province = { id: string; slug: string; name: string; landlineAreaCodes: string };
type District = { id: string; provinceId: string; slug: string; name: string };

function lastPathSegment(url: string): string {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function toCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const OUTPUT_COLUMNS = [
  "id",
  "name",
  "slug",
  "provinceId",
  "districtId",
  "neighborhood",
  "address",
  "phonePrimary",
  "phoneSecondary",
  "latitude",
  "longitude",
  "openingHours",
  "is24Hours",
  "website",
  "mapQuery",
  "sourceType",
  "sourceName",
  "sourceUrl",
  "sourceRecordId",
  "sourceDate",
  "lastVerifiedAt",
  "confidenceScore",
  "status",
  "createdAt",
  "updatedAt",
  "internalNotes",
] as const;

function main() {
  if (!existsSync(RAW_PATH)) {
    console.error(`Kaynak dosya bulunamadı: ${RAW_PATH}`);
    process.exit(1);
  }

  const provinces = parse(readFileSync(sourcePath("provinces.csv"), "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Province[];
  const districts = parse(readFileSync(sourcePath("districts.csv"), "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as District[];

  const provinceBySlug = new Map(provinces.map((p) => [p.slug, p]));
  const districtByKey = new Map(districts.map((d) => [`${d.provinceId}::${d.slug}`, d]));

  const sourceRows = parse(readFileSync(RAW_PATH, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as SourceRow[];

  const outputRows: Record<(typeof OUTPUT_COLUMNS)[number], string>[] = [];
  const idSeen = new Set<string>();
  const skipReasons: string[] = [];

  for (const row of sourceRows) {
    let ilSlug = row.il.trim();
    let ilceSlug = row.ilce.trim();

    const pairKey = `${ilSlug}::${ilceSlug}`;
    const correction = PROVINCE_DISTRICT_CORRECTIONS[pairKey];
    if (correction) {
      ilSlug = correction.il;
      ilceSlug = correction.ilce;
    }

    const province = provinceBySlug.get(ilSlug);
    if (!province) {
      skipReasons.push(`Bilinmeyen il: "${ilSlug}" (${row.durak_adi})`);
      continue;
    }

    const aliasedIlceSlug = DISTRICT_SLUG_ALIASES[`${province.id}::${ilceSlug}`] ?? ilceSlug;
    const district = districtByKey.get(`${province.id}::${aliasedIlceSlug}`);
    if (!district) {
      skipReasons.push(`Bilinmeyen ilçe: "${ilSlug}/${ilceSlug}" (${row.durak_adi})`);
      continue;
    }

    const standSlug = lastPathSegment(row.detay_link) || undefined;
    if (!standSlug) {
      skipReasons.push(`detay_link'ten slug çıkarılamadı: ${row.durak_adi}`);
      continue;
    }

    let id = `${district.id}-${standSlug}`;
    let suffix = 2;
    while (idSeen.has(id)) {
      id = `${district.id}-${standSlug}-${suffix}`;
      suffix++;
    }
    idSeen.add(id);

    const name = row.durak_adi.trim();
    const address = row.adres?.trim() ?? "";
    const mapQuery = address
      ? `${name}, ${address}`
      : `${name}, ${district.name}, ${province.name}`;

    outputRows.push({
      id,
      name,
      slug: standSlug,
      provinceId: province.id,
      districtId: district.id,
      neighborhood: "",
      address,
      phonePrimary: row.telefon?.trim() ?? "",
      phoneSecondary: "",
      latitude: "",
      longitude: "",
      openingHours: "",
      is24Hours: "",
      website: "",
      mapQuery,
      sourceType: "manual",
      sourceName: "taksi724.com (kullanıcı tarafından derlenip temizlenmiş durak dizini)",
      sourceUrl: row.detay_link?.trim() ?? "",
      sourceRecordId: standSlug,
      sourceDate: "",
      lastVerifiedAt: TODAY,
      confidenceScore: "50",
      status: "active",
      createdAt: TODAY,
      updatedAt: TODAY,
      internalNotes: "",
    });
  }

  /**
   * The raw source reuses the identical phone number across many unrelated, differently
   * named stands in different districts/provinces (e.g. one number appears on 75 unrelated
   * "taksi durağı" listings spanning 8 provinces) — a template/placeholder artifact of the
   * source site, not a real shared dispatch line. A phone shared by 5+ records, or by any 2
   * records in different provinces, is treated as untrustworthy and blanked (the stand's
   * name/address/location are kept — only the specific, likely-wrong phone digit string is
   * dropped) rather than publishing a number that almost certainly reaches the wrong city.
   */
  function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  }
  const phoneGroups = new Map<string, (typeof outputRows)[number][]>();
  for (const r of outputRows) {
    const key = normalizePhone(r.phonePrimary);
    if (!key) continue;
    const group = phoneGroups.get(key) ?? [];
    group.push(r);
    phoneGroups.set(key, group);
  }
  let suspiciousPhoneCount = 0;
  for (const group of phoneGroups.values()) {
    if (group.length < 2) continue;
    const provinceCount = new Set(group.map((r) => r.provinceId)).size;
    if (group.length >= 5 || provinceCount >= 2) {
      for (const r of group) {
        r.phonePrimary = "";
        r.internalNotes =
          "Kaynakta bu telefon numarası birçok ilgisiz durakta tekrarlanıyor (şablon/placeholder olduğu değerlendirildi); telefon alanı bu yüzden boş bırakıldı.";
        suspiciousPhoneCount++;
      }
    }
  }

  /**
   * Second, independent phone check: a landline (0-prefixed, non-05xx) whose area code
   * doesn't match its own province's verified landlineAreaCodes (provinces.csv) — same
   * "don't publish a likely-wrong number" reasoning as above, checked against real data
   * rather than a fabricated assumption.
   */
  const provinceById = new Map(provinces.map((p) => [p.id, p]));
  let mismatchedAreaCodeCount = 0;
  for (const r of outputRows) {
    if (!r.phonePrimary) continue;
    const digits = r.phonePrimary.replace(/\D/g, "").replace(/^90/, "");
    const local = digits.startsWith("0") ? digits : `0${digits}`;
    if (local.length !== 11 || local.startsWith("05")) continue; // GSM numbers are exempt
    const areaCode = local.slice(0, 4);
    const province = provinceById.get(r.provinceId);
    const validCodes = province?.landlineAreaCodes.split(";").filter(Boolean) ?? [];
    if (validCodes.length > 0 && !validCodes.includes(areaCode)) {
      r.phonePrimary = "";
      r.internalNotes = `Sabit hat alan kodu (${areaCode}) bu durağın iline ait doğrulanmış alan kodlarıyla uyuşmuyor; telefon alanı bu yüzden boş bırakıldı.`;
      mismatchedAreaCodeCount++;
    }
  }

  const lines = [OUTPUT_COLUMNS.join(",")];
  for (const r of outputRows) {
    lines.push(OUTPUT_COLUMNS.map((c) => toCsvField(r[c])).join(","));
  }
  writeFileSync(OUTPUT_PATH, lines.join("\n") + "\n", "utf-8");

  console.log(`Kaynak satır: ${sourceRows.length}`);
  console.log(`Yazılan durak: ${outputRows.length}`);
  console.log(`Şüpheli/şablon telefon nedeniyle boşaltılan: ${suspiciousPhoneCount}`);
  console.log(`Alan kodu il ile uyuşmadığı için boşaltılan: ${mismatchedAreaCodeCount}`);
  console.log(`Atlanan: ${skipReasons.length}`);
  for (const reason of skipReasons) console.log(`  - ${reason}`);
}

main();
