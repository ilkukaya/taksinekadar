import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";
import { getProvinceById } from "../src/lib/repositories/provinces";

type PhoneIssue = {
  standId: string;
  standName: string;
  level: "error" | "warning";
  message: string;
};

const issues: PhoneIssue[] = [];

function isGsmNumber(digits: string): boolean {
  return digits.startsWith("05");
}

function hasInvalidCharacters(raw: string): boolean {
  return /[^0-9+()\s-]/.test(raw);
}

function hasFakeRepeatingDigits(digits: string): boolean {
  const localDigits = digits.slice(-8); // area code + subscriber number, ignoring the "0"
  return /^(\d)\1+$/.test(localDigits);
}

function checkPhone(standId: string, standName: string, provinceId: string, raw: string) {
  if (hasInvalidCharacters(raw)) {
    issues.push({
      standId,
      standName,
      level: "error",
      message: `Geçersiz karakter içeren telefon: "${raw}"`,
    });
    return;
  }

  const digits = raw.replace(/\D/g, "").replace(/^90/, "");
  const local = digits.startsWith("0") ? digits : `0${digits}`;

  if (local.length !== 11) {
    issues.push({
      standId,
      standName,
      level: "error",
      message: `Telefon numarası 11 haneli olmalı (0 dahil), "${raw}" için ${local.length} hane bulundu.`,
    });
    return;
  }

  if (isGsmNumber(local)) return; // GSM numbers are exempt from area-code matching.

  const areaCode = local.slice(0, 4);
  const province = getProvinceById(provinceId);

  if (hasFakeRepeatingDigits(local)) {
    issues.push({
      standId,
      standName,
      level: "warning",
      message: `Şüpheli tekrar eden rakam deseni: "${raw}"`,
    });
  }

  if (!province || province.landlineAreaCodes.length === 0) {
    issues.push({
      standId,
      standName,
      level: "warning",
      message: `İl için sabit hat alan kodu referansı yok, alan kodu uyumu doğrulanamadı (${areaCode}).`,
    });
    return;
  }

  if (!province.landlineAreaCodes.includes(areaCode)) {
    issues.push({
      standId,
      standName,
      level: "warning",
      message: `Alan kodu (${areaCode}) ${province.name} ili ile uyuşmuyor — needs-review olarak işaretlenmeli.`,
    });
  }
}

function checkCrossProvinceDuplicates() {
  const stands = getAllTaxiStands();
  const provinceByPhone = new Map<string, Set<string>>();

  for (const stand of stands) {
    for (const phone of [stand.phonePrimary, stand.phoneSecondary].filter(Boolean) as string[]) {
      const digits = phone.replace(/\D/g, "");
      const provinces = provinceByPhone.get(digits) ?? new Set<string>();
      provinces.add(stand.provinceId);
      provinceByPhone.set(digits, provinces);
    }
  }

  for (const [phone, provinces] of provinceByPhone) {
    if (provinces.size > 1) {
      issues.push({
        standId: "-",
        standName: "-",
        level: "warning",
        message: `Aynı telefon (${phone}) birden fazla ilde kullanılıyor: ${[...provinces].join(", ")}`,
      });
    }
  }
}

function main() {
  const stands = getAllTaxiStands();

  for (const stand of stands) {
    if (stand.phonePrimary) checkPhone(stand.id, stand.name, stand.provinceId, stand.phonePrimary);
    if (stand.phoneSecondary)
      checkPhone(stand.id, stand.name, stand.provinceId, stand.phoneSecondary);
  }

  checkCrossProvinceDuplicates();

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  for (const issue of warnings) console.warn(`UYARI [${issue.standName}]: ${issue.message}`);
  for (const issue of errors) console.error(`HATA [${issue.standName}]: ${issue.message}`);

  console.log(
    `\nTelefon doğrulama: ${stands.length} durak tarandı, ${errors.length} hata, ${warnings.length} uyarı.`,
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
