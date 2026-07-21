const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrencyTRY(value: number): string {
  return `${currencyFormatter.format(value)} TL`;
}

const TURKISH_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** Formats a YYYY-MM-DD business date as e.g. "20 Temmuz 2026" without relying on ICU locale data. */
export function formatDateTR(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const monthName = TURKISH_MONTHS[Number(month) - 1];
  if (!monthName) return isoDate;
  return `${Number(day)} ${monthName} ${year}`;
}

export function formatPhoneDisplay(phone: string): string {
  return phone.trim();
}

/** Converts a displayed Turkish phone number to a dialable tel: href (E.164-ish, +90 prefixed). */
export function formatPhoneForTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  return `+90${digits}`;
}
