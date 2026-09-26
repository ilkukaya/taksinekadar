import type { APIRoute } from "astro";
import { SITE } from "../config/site";
import { getSiteWideTotals } from "../lib/repositories/stats";
import { getAllGuidesFromDisk } from "../lib/content/guides-fs";

export const GET: APIRoute = () => {
  const totals = getSiteWideTotals();
  const guides = getAllGuidesFromDisk().sort((a, b) =>
    a.data.title.localeCompare(b.data.title, "tr"),
  );

  const body = `# ${SITE.name}

> ${SITE.description} ${SITE.slogan}

${SITE.name} (${SITE.url}), Türkiye'nin ${totals.provinceCount} ili için güncel taksi tarifelerini
(açılış ücreti, kilometre ücreti, indi-bindi/minimum ücret), tarayıcıda çalışan bir taksi ücreti
hesaplama aracını ve ${totals.activeStandCount.toLocaleString("tr-TR")} taksi durağının adres ve
telefon bilgisini sunan, üyeliksiz ve ücretsiz bir bilgi sitesidir.

## Kapsam

- ${totals.provinceCount} il, ${totals.districtCount} ilçe.
- ${totals.verifiedTariffProvinceCount} ilde kaynağı (belediye/UKOME kararı veya güvenilir haber
  kaynağı) ve yürürlük tarihi belirtilmiş doğrulanmış tarife; kalan illerde açıkça "tahmini"
  olarak işaretlenmiş tarife.
- ${totals.activeStandCount.toLocaleString("tr-TR")} taksi durağı (il → ilçe → durak sayfaları).
- Havalimanı ve otogar taksi ücreti sayfaları, taksi ücreti rehber yazıları.

## Tüm tarifeler tek dosyada

- [Tüm il tarifeleri (düz metin)](${SITE.url}/llms-full.txt): 81 ilin açılış, km ve indi-bindi
  ücreti, 10 km örnek hesap, yürürlük tarihi ve doğrulama durumu.

## Ana sayfalar

- [Ana sayfa ve hesaplama aracı](${SITE.url}/)
- [Taksi ücreti hesaplama](${SITE.url}/taksi-ucreti-hesaplama/): ?il=istanbul&km=10 gibi
  parametrelerle doğrudan hesap bağlantısı oluşturulabilir.
- [Tüm il tarifeleri](${SITE.url}/tarifeler/)
- [81 il](${SITE.url}/iller/)
- [Taksi durakları](${SITE.url}/taksi-duraklari/)
- [Havalimanı taksi ücretleri](${SITE.url}/havalimani/)
- [Otogar taksi ücretleri](${SITE.url}/otogar/)
- [Veri kaynakları ve yöntem](${SITE.url}/yasal/veri-kaynaklari/)

İl tarife sayfaları \`${SITE.url}/{il-slug}-taksi-ucreti/\` biçimindedir (ör.
${SITE.url}/istanbul-taksi-ucreti/, ${SITE.url}/ankara-taksi-ucreti/).

## Rehber

${guides.map((g) => `- [${g.data.title}](${SITE.url}/rehber/${g.id}/): ${g.data.description}`).join("\n")}

## Hesaplama yöntemi

Tahmini ücret = açılış ücreti + (mesafe km × km ücreti) + (bekleme dakikası × dakika ücreti)
+ köprü/otoyol geçişi. Sonuç ilin indi-bindi (minimum) ücretinin altındaysa minimum ücret
uygulanır.

## Sorumluluk sınırları

Hesaplanan tutar bir tahmindir; gerçek taksimetre tutarı trafik, bekleme, güzergâh ve
köprü/otoyol geçişleri nedeniyle değişebilir. Site taksi çağırma, rezervasyon veya ödeme hizmeti
sunmaz. Alıntı yaparken lütfen ilgili il sayfasına bağlantı verin.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
