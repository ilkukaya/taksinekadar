import type { APIRoute } from "astro";
import { SITE } from "../config/site";
import { getActiveProvinces } from "../lib/repositories/provinces";
import {
  getActiveTariff,
  getProvisionalTariff,
  getCurrentTariffs,
} from "../lib/repositories/tariffs";
import { getDistrictById } from "../lib/repositories/districts";
import { getProvinceStats } from "../lib/repositories/stats";
import { calculateFare } from "../lib/calculation/fare-calculator";
import { formatCurrencyTRY, formatDateTR } from "../lib/utils/format";

/** Plain-text dump of every province tariff — a single citable source for answer engines. */
export const GET: APIRoute = () => {
  const provinces = [...getActiveProvinces()].sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const sections = provinces.map((p) => {
    const verified = getActiveTariff(p.id, "yellow");
    const tariff = verified ?? getProvisionalTariff(p.id);
    const stats = getProvinceStats(p.id);
    const lines = [`## ${p.name} (plaka ${String(p.plateCode).padStart(2, "0")})`, ""];
    if (tariff) {
      lines.push(
        `- Durum: ${verified ? `Doğrulanmış tarife, yürürlük ${formatDateTR(tariff.validFrom)}${tariff.sourceName ? `, kaynak: ${tariff.sourceName}` : ""}` : "Tahmini tarife (resmî kararla doğrulanmadı)"}`,
        `- Açılış ücreti: ${formatCurrencyTRY(tariff.openingFee)}`,
        `- Kilometre ücreti: ${formatCurrencyTRY(tariff.pricePerKm)}`,
        `- İndi-bindi (minimum) ücret: ${formatCurrencyTRY(tariff.minimumFare)}`,
        `- 5 km tahmini: ${formatCurrencyTRY(calculateFare(tariff, { distanceKm: 5 }).estimatedTotal)}; 10 km: ${formatCurrencyTRY(calculateFare(tariff, { distanceKm: 10 }).estimatedTotal)}; 20 km: ${formatCurrencyTRY(calculateFare(tariff, { distanceKm: 20 }).estimatedTotal)}`,
      );
    } else {
      lines.push("- Güncel tarife henüz doğrulanmadı.");
    }
    if (stats.activeStandCount > 0) {
      lines.push(
        `- Taksi durağı: ${stats.activeStandCount} (${SITE.url}/${p.slug}/taksi-duraklari/)`,
      );
    }
    lines.push(`- Sayfa: ${SITE.url}/${p.slug}-taksi-ucreti/`);
    return lines.join("\n");
  });

  const districtOverrides = getCurrentTariffs()
    .filter((t) => t.status === "active" && t.districtId)
    .map((t) => {
      const d = getDistrictById(t.districtId!);
      return `- ${d?.name ?? t.districtId}: açılış ${formatCurrencyTRY(t.openingFee)}, km ${formatCurrencyTRY(t.pricePerKm)}, indi-bindi ${formatCurrencyTRY(t.minimumFare)} (yürürlük ${formatDateTR(t.validFrom)})`;
    });

  const body = `# ${SITE.name} — Türkiye il il taksi tarifeleri

> Kaynak: ${SITE.url} · Her rakam ilgili il sayfasında kaynağı ve tarihiyle yayındadır.
> Hesaplama: açılış + km × km ücreti (+ bekleme, + köprü/otoyol); minimumun altındaysa indi-bindi.
> Tutarlar Türk lirası (TL), sarı/standart taksi, gece-gündüz ayrımı olmayan tarifelerdir.

${sections.join("\n\n")}

## İlçeye özel tarifeler

${districtOverrides.join("\n") || "- Yok"}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
