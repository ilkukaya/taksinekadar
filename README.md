# Taksi Ne Kadar?

Türkiye'nin 81 ili ve ilçeleri için taksi ücreti hesaplama ve taksi durakları rehberi.
Tamamen statik (Astro/SSG), üyeliksiz, canlı API'siz bir bilgi ve hesaplama platformu.

- Domain: `https://taksinekadar.com`
- Slogan: _Binmeden önce ne kadar tutacağını bil._

Bu doküman, `639068f6-taksinekadarbirlesikmasterprompt.md` adlı proje talimatına göre kurulmuş
projenin mevcut durumunu, mimarisini ve veri güncelleme akışını açıklar.

---

## 0. Hızlı Başlangıç

```bash
pnpm install
pnpm dev             # http://localhost:4321
pnpm build           # tam pipeline: arama indeksi → build → sitemap → link denetimi → rapor
pnpm test            # Vitest
pnpm test:e2e        # Playwright (önce `pnpm build:astro-only && pnpm preview` gerekmez, webServer otomatik başlar)
```

---

## 1. Mevcut Durum (Faz)

Proje, master promptun kendi önerdiği aşamalı yayın planına (bölüm 40) göre inşa edilmektedir.
Bu ilk teslimat **Faz 1 ve ötesinde bazı Faz 3 unsurlarını** kapsar:

| Kapsam                                      | Durum                                                            |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Marka, Astro/Tailwind iskeleti              | ✅ Tamamlandı                                                    |
| Taksi ücreti hesaplama motoru (client-side) | ✅ Tamamlandı                                                    |
| 81 il hub + il tarife sayfaları             | ✅ Tamamlandı                                                    |
| 973 ilçe referans verisi                    | ✅ Tamamlandı (yalnızca veri; ilçe sayfaları henüz yok)          |
| Doğrulanmış büyükşehir tarifeleri           | ⚠️ Kısmi — aşağıya bakın                                         |
| Havalimanı ve otogar sayfaları              | ✅ Tamamlandı (plan Faz 3'tü, veri hazır olduğu için öne alındı) |
| Rehber (SSS) içerikleri                     | ✅ 7 makale                                                      |
| Taksi durağı verisi (OSM + belediye)        | ❌ Faz 2 — bilinçli olarak ertelendi                             |
| İlçe ve durak sayfaları                     | ❌ Faz 2 — durak verisi olmadan boş sayfa üretilmedi             |
| Popüler rotalar                             | ❌ Faz 3 — doğrulanmış mesafe verisi yok                         |
| Hastane/AVM kümeleri                        | ❌ Faz 4                                                         |

**Neden bu sınır?** Proje talimatı açıkça "bilmediğin tarifeyi, telefonu, adresi... asla
uydurma" diyor. Taksi durağı verisi gerçek bir OSM/Geofabrik PBF indirmesi veya belediye açık
veri portalı erişimi gerektirir; bu oturumda böyle bir veri seti işlenmediği için tek bir sahte
durak kaydı bile eklenmedi. Aynı ilke rotalar ve hastane/AVM kümeleri için de geçerli.

---

## 2. Doğrulanmış Tarife Durumu

Aşağıdaki 10 il için resmî/haber kaynaklı, tarihli ve kaynak bağlantılı tarife yayındadır:
İstanbul, Ankara, İzmir, Adana, Mersin, Gaziantep, Konya, Kayseri, Samsun, Trabzon. Ayrıca
Antalya iline bağlı Alanya ve Gazipaşa ilçeleri için ilçe bazlı ayrı bir tarife de yayındadır.

**Doğrulanamayan iller:** Antalya (il geneli), Bursa, Kocaeli, Muğla, Balıkesir. Bu oturumda
web araştırma bütçesi (WebSearch) tükendiği ve WebFetch birçok kaynakta 403 ile engellendiği
için bu 5 il için güvenilir doğrulama tamamlanamadı. Bu iller sitede **rakam göstermez**;
"tarife henüz doğrulanmadı" ibaresiyle sunulur ve ilgili tarife sayfası `noindex` işaretlenir.
Bir sonraki `pnpm data:validate` + araştırma turunda bu iller önceliklendirilmelidir.

Tüm tarife kaynakları, yürürlük tarihleri ve güven puanları `data/source/tariffs.csv` ve
`data/source/tariff-history.csv` dosyalarında satır satır görülebilir.

---

## 3. Belgelenmiş Varsayımlar

Proje talimatı, eksik bilgi projeyi durdurmuyorsa güvenli ve geri alınabilir bir varsayım
yapılmasını ve bunun burada belirtilmesini istiyor. Yapılan varsayımlar:

1. **Sabit hat alan kodları (`landlineAreaCodes`) boş bırakıldı.** Bu oturumda canlı doğrulama
   yapılamadığı için (WebSearch/WebFetch erişimi tükendi), hiçbir ile alan kodu ataması
   yapılmadı. Şu an bu alanı kullanan bir doğrulama akışı yok (durak verisi henüz yok); telefon
   doğrulama devreye girmeden önce BTK numaralandırma planına karşı doldurulmalıdır.
2. **İlçe `officialCode` alanı, resmî bir devlet kaydı olduğu iddiası taşımaz.** Birbirinden
   bağımsız iki kamuya açık il/ilçe veri kümesi karşılaştırılarak derlenmiş dahili, stabil bir
   koddur; join/routing için güvenilirdir ama TÜİK/NVİ resmî ilçe koduyla bire bir eşleştiği
   ayrıca teyit edilmemiştir.
3. **Araç türü olarak varsayılan `yellow` (sarı taksi) tüm illerde kullanıldı**, yalnızca
   İstanbul'a özgü bir etiket olarak değil — Türkiye genelinde ticari taksilerin sarı renkte
   olması yaygın pratik olduğundan, hesaplama aracının varsayılan seçimiyle tutarlı olsun diye
   bu şekilde modellendi. İstanbul'un turkuaz ve 8+1 segmentleri ayrıca `turquoise` /
   `eight-plus-one` olarak eklendi.
4. **Trabzon'un kademeli (0-5 km / 5 km üzeri) kilometre ücreti tek bir orana indirgendi**
   (5 km üzeri oranı kullanıldı) çünkü veri modeli tek bir `pricePerKm` alanı öngörüyor;
   asıl kademeli yapı `sourceDocument` alanında not edilmiştir.
5. **Bölge sınıflandırması** klasik "7 coğrafi bölge" sistemine göre yapılmıştır (Marmara, Ege,
   Akdeniz, İç Anadolu, Karadeniz, Doğu Anadolu, Güneydoğu Anadolu) — TÜİK'in İBBS (NUTS)
   bölgeleri değil, halk arasında yaygın kullanılan klasik sistemdir.
6. **İl/ilçe enlem-boylam alanları boş bırakıldı.** Site hiçbir gömülü/canlı harita
   kullanmadığından bu alanlar şu an işlevsel değildir; ileride gerçek kaynaklarla doldurulabilir.
7. **AdSense yayıncı kimliği (`PUBLIC_ADSENSE_PUB_ID`) yapılandırılmadı.** Reklam bileşenleri
   tamamen hazır ve CLS yaratmayacak şekilde yer ayırıyor, ancak env değişkeni tanımlanana kadar
   hiçbir reklam scripti veya sahte yayıncı kimliği yüklenmez.

---

## 4. Teknik Yığın

- **Framework:** Astro 7 (tam statik SSG çıktısı, `output` varsayılanı)
- **Dil:** TypeScript
- **Stil:** Tailwind CSS v4 (CSS-first `@theme` yapılandırması, `tailwind.config.js` yok)
- **Veri doğrulama:** Zod
- **Test:** Vitest (birim) + Playwright (e2e)
- **Paket yöneticisi:** pnpm
- **Kod kalitesi:** ESLint (flat config) + Prettier
- **Build ve deploy:** Netlify, git push'ta kendi build'ini çalıştırır (bkz. `netlify.toml`) —
  komut `pnpm data:validate && pnpm test && pnpm build` olduğundan veri hatası, başarısız test
  veya kırık link/orphan sayfa varsa deploy gerçekleşmez. Ayrı bir GitHub Actions deploy
  workflow'u yok; şu an düzenli/otomatik çekilen bir veri kaynağı olmadığından buna gerek
  görülmedi. `.github/workflows/seo-audit.yml` yalnızca pull request'lerde lint/test/build
  çalıştıran, secret gerektirmeyen bir kontrol katmanıdır.

Sayfaların büyük çoğunluğu sıfır JavaScript ile çalışır. JavaScript yalnızca hesaplama aracında,
site içi aramada ve reklam script'lerinde (yalnızca yayıncı kimliği tanımlıysa) kullanılır.
Mobil menü, JavaScript kullanmadan yerel `<details>/<summary>` ile çalışır.

---

## 5. Klasör Yapısı

```text
data/source/       Elle düzenlenen kaynak CSV'ler (tek doğruluk kaynağı)
data/normalized/   normalize-data.ts çıktısı (git-ignored, her seferinde yeniden üretilir)
data/reports/      Build/duplicate/change raporları (git-ignored)
scripts/           Veri pipeline script'leri (bkz. bölüm 7)
src/config/        Marka (SITE) ve araç türü yapılandırması
src/lib/           Doğrulama şemaları, repository katmanı, hesaplama motoru, Türkçe ek motoru,
                   SEO/schema.org yardımcıları
src/components/    Astro bileşenleri (hesaplama, durak kartı, tarife tablosu, reklam alanları...)
src/layouts/       Temel sayfa şablonu
src/pages/         Rotalar (bkz. bölüm 6)
src/content/rehber/ Rehber (SSS) markdown içerikleri
tests/             Vitest birim testleri
tests/e2e/         Playwright uçtan uca testleri
```

---

## 6. URL Haritası (mevcut)

```text
/                                  Ana sayfa
/taksi-ucreti-hesaplama/           Hesaplama aracı
/iller/                            81 il listesi
/{il}-taksi-ucreti/                İl tarife sayfası (81 sayfa, doğrulanmamışsa noindex)
/tarifeler/                        Doğrulanmış/doğrulanmamış il listesi
/havalimani/  , /havalimani/{slug}/  Havalimanı taksi ücreti sayfaları
/otogar/      , /otogar/{slug}/      Otogar taksi ücreti sayfaları
/rehber/      , /rehber/{slug}/      SSS / rehber makaleleri
/yasal/veri-kaynaklari/            Veri kaynakları ve güncellik yöntemi
/yasal/gizlilik-politikasi/        (noindex)
/yasal/kullanim-sartlari/          (noindex)
/yasal/iletisim/
/taksi-duraklari/                  Faz 2 duyurusu (noindex, durak verisi gelene kadar)
/404
```

`/istanbul/kadikoy/taksi-duraklari/` gibi ilçe ve durak sayfaları, gerçek doğrulanmış durak
verisi olmadan **kasıtlı olarak üretilmedi** — spesifikasyonun kendi kuralı gereği ("Sadece
'durak yok' metniyle boş sayfa üretme").

---

## 7. Veri Güncelleme Akışı

```bash
pnpm data:validate            # Zod + çapraz referans doğrulama (kritik hata build'i durdurur)
pnpm data:validate-phones     # Telefon format/alan kodu/GSM kontrolleri
pnpm data:validate-geography  # Türkiye sınırı, (0,0), aynı koordinat kümesi kontrolleri
pnpm data:normalize           # data/normalized/ üretir
pnpm data:duplicates          # Mükerrerlik puanlama (bkz. spec §14.4), data/reports/duplicates.json
pnpm data:change-report       # Son commit'e göre değişiklik özeti + IndexNow URL listesi
pnpm build                    # search-index → astro build → sitemap → internal-link audit → build report
pnpm indexnow:submit          # INDEXNOW_KEY tanımlıysa değişen URL'leri bildirir
```

`pnpm build` tek komutla şu zinciri çalıştırır: arama indeksi → Astro build → sitemap üretimi →
iç bağlantı denetimi → build raporu. Kırık link, orphan sayfa veya tekrarlanan title/description
bulunursa build **başarısız olur** (spec'in "kritik hata build'i durdursun" kuralı).

### Faz 2 veri hattı (henüz çalıştırılamadı)

`scripts/import-osm.ts`, `scripts/import-municipal-data.ts` ve `scripts/merge-data.ts` gerçek
kodla yazılmıştır ve doğru mimariye sahiptir, ancak:

- `import-osm.ts`, gerçek bir Geofabrik Türkiye PBF dosyası ve bir PBF ayrıştırıcı paketi
  (henüz eklenmedi) bekler; dosya yoksa net bir mesajla çıkar.
- `import-municipal-data.ts`, 8 büyükşehir için bir parser kayıt defteri içerir; her parser,
  ilgili açık veri portalının gerçek yanıtı incelenmeden yazılmadığı için şu an hata fırlatır.
- `merge-data.ts` tamamen çalışır durumdadır (alan bazlı önceliklendirme, §12.3) ve yukarıdaki
  iki script gerçek aday kayıt ürettiğinde doğrudan kullanılabilir.

---

## 8. Ortam Değişkenleri

| Değişken                | Amaç                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_ADSENSE_PUB_ID` | AdSense yayıncı kimliği. **Netlify'da** Site configuration → Environment variables'a eklenmeli (tanımsızsa reklam alanları hiç render edilmez). |
| `INDEXNOW_KEY`          | IndexNow anahtarı; yalnızca `pnpm indexnow:submit` elle çalıştırıldığında kullanılır (tanımsızsa atlanır).                                      |
| `OSM_PBF_PATH`          | Faz 2 OSM import script'i için yerel PBF dosya yolu.                                                                                            |

---

## 9. Testler

```bash
pnpm test        # Vitest — Türkçe ek motoru, hesaplama motoru, veri bütünlüğü, marka taraması
pnpm test:e2e    # Playwright — hesaplama, arama, mobil menü, 404, havalimanı/otogar sayfaları
pnpm lint        # ESLint
pnpm check       # astro check (TypeScript + Astro şablon denetimi)
```

---

## 10. Yayın Öncesi Kontrol Listesi

Bkz. proje talimatının 41. bölümü. Bu teslimatta henüz karşılanmayan maddeler: durak verisi,
ilçe sayfaları, popüler rotalar, hastane/AVM kümeleri, Antalya/Bursa/Kocaeli/Muğla/Balıkesir
tarife doğrulaması, Lighthouse ölçümü (gerçek bir deploy sonrası yapılmalı).
