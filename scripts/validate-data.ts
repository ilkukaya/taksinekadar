import { getAllProvinces } from "../src/lib/repositories/provinces";
import { getAllDistricts } from "../src/lib/repositories/districts";
import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";
import { getCurrentTariffs, getTariffHistory } from "../src/lib/repositories/tariffs";
import { getAllAirports } from "../src/lib/repositories/airports";
import { getAllBusTerminals } from "../src/lib/repositories/bus-terminals";

type Issue = { level: "error" | "warning"; message: string };

const issues: Issue[] = [];
const error = (message: string) => issues.push({ level: "error", message });
const warning = (message: string) => issues.push({ level: "warning", message });

function findDuplicates<T>(items: T[], keyOf: (item: T) => string): string[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function validateProvinces() {
  const provinces = getAllProvinces();
  const active = provinces.filter((p) => p.status === "active");

  if (active.length !== 81) {
    error(`Aktif il sayısı 81 olmalı, ${active.length} bulundu.`);
  }

  const dupPlateCodes = findDuplicates(provinces, (p) => String(p.plateCode));
  if (dupPlateCodes.length > 0) {
    error(`Tekrarlanan plaka kodu: ${dupPlateCodes.join(", ")}`);
  }

  const dupSlugs = findDuplicates(provinces, (p) => p.slug);
  if (dupSlugs.length > 0) {
    error(`Tekrarlanan il slug'ı: ${dupSlugs.join(", ")}`);
  }

  return provinces;
}

function validateDistricts(provinceIds: Set<string>) {
  const districts = getAllDistricts();

  for (const district of districts) {
    if (!provinceIds.has(district.provinceId)) {
      error(
        `İlçe "${district.name}" (${district.id}) bilinmeyen bir ile bağlı: ${district.provinceId}`,
      );
    }
  }

  const dupCompositeSlugs = findDuplicates(districts, (d) => `${d.provinceId}::${d.slug}`);
  if (dupCompositeSlugs.length > 0) {
    error(`Aynı il içinde tekrarlanan ilçe slug'ı: ${dupCompositeSlugs.join(", ")}`);
  }

  const dupIds = findDuplicates(districts, (d) => d.id);
  if (dupIds.length > 0) {
    error(`Tekrarlanan ilçe id'si: ${dupIds.join(", ")}`);
  }

  if (districts.length !== 973) {
    warning(`İlçe sayısı 973 olarak bekleniyordu, ${districts.length} bulundu (bilgi amaçlı).`);
  }

  return districts;
}

function validateTaxiStands(provinceIds: Set<string>, districtIds: Set<string>) {
  const stands = getAllTaxiStands();

  for (const stand of stands) {
    if (!provinceIds.has(stand.provinceId)) {
      error(`Durak "${stand.name}" (${stand.id}) bilinmeyen bir ile bağlı: ${stand.provinceId}`);
    }
    if (!districtIds.has(stand.districtId)) {
      error(`Durak "${stand.name}" (${stand.id}) bilinmeyen bir ilçeye bağlı: ${stand.districtId}`);
    }
  }

  const dupIds = findDuplicates(stands, (s) => s.id);
  if (dupIds.length > 0) {
    error(`Tekrarlanan durak id'si: ${dupIds.join(", ")}`);
  }

  return stands;
}

function validateTariffs(provinceIds: Set<string>, districtIds: Set<string>) {
  const tariffs = [...getCurrentTariffs(), ...getTariffHistory()];

  for (const tariff of tariffs) {
    if (!provinceIds.has(tariff.provinceId)) {
      error(`Tarife (${tariff.id}) bilinmeyen bir ile bağlı: ${tariff.provinceId}`);
    }
    if (tariff.districtId && !districtIds.has(tariff.districtId)) {
      error(`Tarife (${tariff.id}) bilinmeyen bir ilçeye bağlı: ${tariff.districtId}`);
    }
    if (tariff.minimumFare < tariff.openingFee) {
      warning(
        `Tarife (${tariff.id}): minimum ücret (${tariff.minimumFare}) açılış ücretinden (${tariff.openingFee}) düşük.`,
      );
    }
    if (tariff.validUntil && tariff.validUntil < tariff.validFrom) {
      error(`Tarife (${tariff.id}): validUntil, validFrom'dan önce olamaz.`);
    }
  }

  // Conflict check: two ACTIVE tariffs for the same province+district+vehicleType.
  const activeTariffs = getCurrentTariffs().filter((t) => t.status === "active");
  const conflictKeys = findDuplicates(
    activeTariffs,
    (t) => `${t.provinceId}::${t.districtId ?? ""}::${t.vehicleType}`,
  );
  if (conflictKeys.length > 0) {
    error(`Çakışan aktif tarife (aynı il/ilçe/araç türü): ${conflictKeys.join(", ")}`);
  }

  const staleThresholdDays = 240;
  const now = new Date();
  for (const tariff of activeTariffs) {
    const lastVerified = new Date(tariff.lastVerifiedAt);
    const daysSince = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > staleThresholdDays) {
      warning(`Tarife (${tariff.id}): son kontrolden bu yana ${Math.round(daysSince)} gün geçmiş.`);
    }
  }

  return tariffs;
}

function validatePois(provinceIds: Set<string>, districtIds: Set<string>) {
  for (const airport of getAllAirports()) {
    if (!provinceIds.has(airport.provinceId)) {
      error(`Havalimanı "${airport.name}" bilinmeyen bir ile bağlı: ${airport.provinceId}`);
    }
    if (!districtIds.has(airport.districtId)) {
      error(`Havalimanı "${airport.name}" bilinmeyen bir ilçeye bağlı: ${airport.districtId}`);
    }
  }

  for (const terminal of getAllBusTerminals()) {
    if (!provinceIds.has(terminal.provinceId)) {
      error(`Otogar "${terminal.name}" bilinmeyen bir ile bağlı: ${terminal.provinceId}`);
    }
    if (!districtIds.has(terminal.districtId)) {
      error(`Otogar "${terminal.name}" bilinmeyen bir ilçeye bağlı: ${terminal.districtId}`);
    }
  }
}

function main() {
  console.log("Veri doğrulama başlıyor...\n");

  const provinces = validateProvinces();
  const provinceIds = new Set(provinces.map((p) => p.id));

  const districts = validateDistricts(provinceIds);
  const districtIds = new Set(districts.map((d) => d.id));

  validateTaxiStands(provinceIds, districtIds);
  validateTariffs(provinceIds, districtIds);
  validatePois(provinceIds, districtIds);

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  for (const issue of warnings) console.warn(`UYARI: ${issue.message}`);
  for (const issue of errors) console.error(`HATA: ${issue.message}`);

  console.log(
    `\nSonuç: ${provinces.length} il, ${districts.length} ilçe, ${errors.length} hata, ${warnings.length} uyarı.`,
  );

  if (errors.length > 0) {
    console.error("\nKritik veri hatası bulundu — build durduruluyor.");
    process.exit(1);
  }

  console.log("Veri doğrulama başarılı.");
}

main();
