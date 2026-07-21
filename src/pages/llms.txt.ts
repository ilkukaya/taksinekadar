import type { APIRoute } from "astro";
import { SITE } from "../config/site";
import { getSiteWideTotals } from "../lib/repositories/stats";

export const GET: APIRoute = () => {
  const totals = getSiteWideTotals();

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.slogan}

## Kapsam

- Türkiye'nin ${totals.provinceCount} ili ve ${totals.districtCount} ilçesi için taksi ücreti
  hesaplama ve taksi durağı rehberi.
- Şu an ${totals.verifiedTariffProvinceCount} ilde kaynağı doğrulanmış güncel taksi tarifesi
  yayınlanmaktadır; diğer illerde tarife doğrulandıkça eklenir.
- Taksi durağı telefon/adres verileri henüz yayında değildir (geliştirme aşamasındadır).

## Ana URL'ler

- ${SITE.url}/ — Ana sayfa ve hesaplama aracı
- ${SITE.url}/taksi-ucreti-hesaplama/ — Taksi ücreti hesaplama aracı
- ${SITE.url}/iller/ — Türkiye'nin 81 ili
- ${SITE.url}/tarifeler/ — İl bazlı taksi tarifeleri
- ${SITE.url}/havalimani/ — Havalimanı taksi ücreti bilgileri
- ${SITE.url}/otogar/ — Otogar taksi ücreti bilgileri
- ${SITE.url}/rehber/ — Taksi ücreti ve taksimetre hakkında rehber yazıları
- ${SITE.url}/yasal/veri-kaynaklari/ — Veri kaynakları ve güncellik yöntemi

## Veri Kaynakları

Tarifeler; belediye/UKOME kararları, esnaf/şoför odası açıklamaları ve güvenilir haber
kaynaklarından derlenir. Her tarife sayfasında kaynak adı, kaynak bağlantısı, yürürlük tarihi ve
son kontrol tarihi ayrı ayrı belirtilir. Kaynağı doğrulanamayan illerde rakam yerine "tarife
henüz doğrulanmadı" ibaresi gösterilir; bu sayfalar arama motorlarında dizinlenmez.

## Güncellik Yöntemi

Veriler periyodik olarak yeniden kontrol edilir ve değişiklikler build sürecinden geçirilerek
siteye yansıtılır.

## Sorumluluk Sınırları

Hesaplama aracının ürettiği tutar bir tahmindir; gerçek taksimetre tutarı trafik, bekleme,
güzergâh ve köprü/otoyol geçişleri nedeniyle değişebilir. Site; taksi çağırma, rezervasyon veya
ödeme hizmeti sunmaz ve kullanıcı verisi toplamaz.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
