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

| Kapsam                                        | Durum                                                            |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Marka, Astro/Tailwind iskeleti                | ✅ Tamamlandı                                                    |
| Taksi ücreti hesaplama motoru (client-side)   | ✅ Tamamlandı                                                    |
| 81 il hub + il tarife sayfaları               | ✅ Tamamlandı                                                    |
| 973 ilçe referans verisi                      | ✅ Tamamlandı (yalnızca veri; ilçe sayfaları henüz yok)          |
| Doğrulanmış il tarifeleri                     | ✅ 41 il + Alanya/Gazipaşa/Cide ilçe tarifesi — aşağıya bakın    |
| Tahmini il tarifeleri (kalan 40 il)           | ✅ Tamamlandı — açıkça ayrı işaretli, bkz. bölüm 2.4             |
| Havalimanı ve otogar sayfaları                | ✅ Tamamlandı (plan Faz 3'tü, veri hazır olduğu için öne alındı) |
| Rehber (SSS) içerikleri                       | ✅ 7 makale                                                      |
| Popüler rotalar                               | ⚠️ Kısmi — 3 doğrulanmış güzergâh yayında, aşağıya bakın         |
| İl sınırı doğrulaması (gerçek OSM poligonu)   | ✅ Tamamlandı — bkz. bölüm 7                                     |
| Taksi durağı verisi + ilçe/il durak sayfaları | ✅ 8285 durak, 77 il / 733 ilçe — bkz. bölüm 2.3                 |
| Hastane/AVM kümeleri                          | ❌ Faz 4                                                         |

**Neden bu sınır?** Proje talimatı açıkça "bilmediğin tarifeyi, telefonu, adresi... asla
uydurma" diyor. Bu ortamda OSM/Geofabrik ve belediye açık veri portallarına erişim engelli
olduğundan (bkz. bölüm 2.1), taksi durağı verisi bu kaynaklardan **bu oturumda** derlenemedi;
bunun yerine kullanıcı tarafından sağlanan, taksi724.com'dan derlenmiş bir dışa aktarım
kullanıldı — bkz. bölüm 2.3 için kaynak, doğrulama ve hariç tutulan veri hakkında tam
açıklama. Hastane/AVM kümeleri için henüz böyle bir veri seti yok, bu yüzden hâlâ Faz 4.
Popüler rotalarda ise mesafesi güvenilir, isimli bir kaynaktan doğrulanamayan güzergâhlar
(örn. İstanbul Havalimanı ↔ Taksim — kaynaklar 35-53 km arasında çelişiyor) kasıtlı olarak
yayınlanmadı; bkz. bölüm 2.2.

---

## 2. Doğrulanmış Tarife Durumu

Aşağıdaki 41 il için resmî/haber kaynaklı, tarihli ve kaynak bağlantılı tarife yayındadır:
İstanbul, Ankara, İzmir, Adana, Mersin, Gaziantep, Konya, Kayseri, Samsun, Trabzon, Antalya
(il geneli), Bursa, Kocaeli, Muğla, Balıkesir, Çorum, Diyarbakır, Giresun, Malatya, Sakarya,
Siirt, Zonguldak, Bayburt, Kırıkkale, Bartın, Yalova, Düzce, Denizli, Edirne, Elazığ, Hakkari,
Kırklareli, Osmaniye, Erzincan, Erzurum, Nevşehir, Niğde, Kars, Ardahan, Afyonkarahisar, Artvin.
Ayrıca Antalya'ya bağlı Alanya/Gazipaşa ve Kastamonu'ya bağlı Cide ilçeleri için ayrı, il
genelinden farklı ilçe tarifeleri yayındadır (Kastamonu merkez için ise henüz doğrulanmış bir
tarih bulunamadığından il geneli tarife hâlâ "doğrulanmadı" durumundadır — yalnızca Cide
ilçesi doğrulanmıştır).

Kullanıcı isteği üzerine bu turda `taksi724.com` ve `taksimetrem.com.tr` özellikle denendi;
ancak WebSearch üzerinden hiçbir ilde gerçek bir sayısal tarife döndürmediler (yalnızca genel
şablon metni — bazen büyükşehir olmayan illeri yanlışlıkla "büyükşehir belediyesi" olarak bile
tanımlayan hatalı, şehre özel olmayan sentezler). Bu yüzden bu iki site **veri kaynağı olarak
kullanılamadı**; tüm yeni tarifeler bunun yerine adı geçen yerel/ulusal haber kaynaklarından
gelmektedir — spesifikasyonun "asla uydurma" kuralına daha uygun bir sonuç. Araştırma sırasında
düzinelerce il için de birbiriyle çelişen, bariz bayat (2022-2024 verisi 2026 diye sunulan) veya
başka bir ile ait olduğu tespit edilen rakamlar bulundu; bunların hiçbiri yayınlanmadı.

Bu ortamda WebFetch neredeyse her haber/kurum sitesinde 403 ile engellendiğinden, tüm tarifeler
WebSearch'ün kendi sentezlediği sonuçlara dayanır — doğrudan sayfa getirme (fetch) ile teyit
edilmemiştir. Bunu telafi etmek için her rakam, en az 2-3 bağımsız isimli haber kaynağı
(mümkün olduğunda AA/DHA gibi ajans kaynakları) arasında karşılaştırılarak doğrulanmış, tek bir
jenerik "taksi hesaplama" sitesine güvenilmemiştir. Güven puanları (`confidenceScore`) bu
doğrulama derinliğini yansıtır; bazı illerde yürürlük tarihi yalnızca ay düzeyinde bilinmektedir
(bu satırlarda ayın 15'i varsayılan olarak işaretlenmiş ve `sourceDocument` alanında açıkça
belirtilmiştir — rakamların kendisi doğrulanmıştır, yalnızca kesin gün belirsizdir). 81 ilin geri
kalan 40'ı için henüz bu şekilde resmî kaynaklı bir tarife yoktur — bkz. §2.4 için bu illerde
şu an ne gösterildiği.

Tüm tarife kaynakları, yürürlük tarihleri ve güven puanları `data/source/tariffs.csv` ve
`data/source/tariff-history.csv` dosyalarında satır satır görülebilir.

### 2.4 Doğrulanmamış iller için tahmini tarife

Kalan 40 il artık boş/uyarı sayfası göstermez: her birinin il sayfasında ve hesaplama aracında
gerçek bir rakam görünür, ancak bu rakam açıkça ve tutarlı biçimde "tahmini" olarak işaretlenir
(`status: unverified`, `confidenceScore: 30`) — doğrulanmış 46 tarifeden (`status: active`)
her yerde ayrı tutulur: `getActiveTariff`/`hasVerifiedTariff` bu kayıtları hiçbir zaman
"doğrulanmış" saymaz, il sayfasında farklı bir bileşen (`EstimatedTariffSummary`, kaynak
bağlantısı olmadan) kullanılır, ve hesaplama sonucunun altında "resmî bir belediye/UKOME
kararıyla ayrıca doğrulanmamıştır" notu yer alır. Bu rakamlar, kullanıcının sağladığı ve tüm 81
il için genel bir hesaplayıcı sitesinden derlenmiş bir tarife paketinden alınmıştır; kaynağın adı
kullanıcı isteği üzerine sitede hiçbir yerde gösterilmez (yalnızca `tariffs.csv`'nin
`sourceDocument` alanında dahili bir not olarak durur, `sourceName`/`sourceUrl` boş bırakılmıştır).

Bu paket doğrudan güvenilmedi: zaten doğrulanmış 41 ille çapraz kontrol edildiğinde 28 ilde
birebir örtüştüğü, ama İstanbul, Balıkesir ve Artvin gibi yakın zamanda zam almış illerde
belirgin şekilde bayat (zam öncesi) rakamlar taşıdığı, Erzurum ve Niğde gibi bazı illerde ise
büyük ve açıklanamayan farklar olduğu tespit edildi — bu yüzden paket yalnızca hiçbir doğrulanmış
tarifesi olmayan 40 il için, sitede olduğu gibi "doğrulanmadı" değil açıkça "tahmini" olarak
kullanıldı; zaten doğrulanmış 41 ilin verisine dokunulmadı.

### 2.1 Taksi durağı / POI veri kaynağı erişilebilirliği

Bu ortamın ağ ilkesi altında `overpass-api.de` (OSM Overpass API) ve büyükşehir belediyelerinin
açık veri portalları (örn. `data.ibb.gov.tr`) bağlantı düzeyinde engellidir (proxy `403 connect
rejected` döndürür, yeniden denemeyle aşılamaz — kod veya kimlik doğrulama sorunu değildir).
Bu nedenle bu iki kaynaktan gerçek bir taksi durağı veri seti bu oturumda indirilemedi/
işlenemedi — durak verisi sonunda başka bir yoldan (kullanıcı tarafından sağlanan bir
dışa aktarım) geldi, bkz. bölüm 2.3. Araştırma sırasında yan bir kazanım olarak, GitHub üzerinden
LFS ile servis edilen bağımsız bir OSM türevi veri seti (`izzetkalic/geojsons-of-turkey`,
ODbL) erişilebilir olduğu için hem il (admin_level=4) hem ilçe (admin_level=6) sınır poligonları
elde edildi ve `scripts/validate-geography.ts`'e gerçek nokta-içinde (point-in-polygon)
doğrulaması olarak entegre edildi — bkz. bölüm 7 ve `/yasal/veri-kaynaklari/`.

**İl/ilçe merkez koordinatları (enlem/boylam):** `provinces.csv` ve `districts.csv`'deki
`latitude`/`longitude` alanları, bu aynı sınır poligonlarından hesaplanan gerçek alan-ağırlıklı
merkez (centroid) noktalarıyla dolduruldu (`src/lib/geography/polygon-centroid.ts` — shoelace
formülüyle, delik/MultiPolygon'u doğru ağırlıklandırarak; `scripts/populate-boundary-centroids.ts`).
İl eşlemesi zaten var olan ISO kod join'iyle 81/81 (%100) sonuçlandı. İlçe eşlemesi doğrudan isim
karşılaştırmasıyla başladı ama kaynak, bazı illerin merkez ilçesini "{İl adı} merkez" gibi bizim
veri setimizde karşılığı olmayan bir kalıpla adlandırıyordu; ayrıca birkaç ilin **tüm ilçeleri**
komşu bir ilin plaka/network etiketiyle yanlış işaretlenmiş durumdaydı (doğrulandı: Kırşehir'in 7
ilçesi kaynakta Kocaeli'nin etiketiyle, Mersin'in 7 ilçesi Hatay'ın etiketiyle görünüyor — ismin
kendisi ve poligon şekli doğru, yalnızca üst veri etiketi hatalı). Bunları çözmek için, hiçbiri
tahmine dayanmayan kademeli bir eşleştirme mantığı yazıldı
(`src/lib/geography/match-district-boundaries.ts`): önce aynı ile ait doğrudan/`"merkez"`
kalıbı/küçük yazım farkı eşleşmesi denenir; başarısız olursa ülke genelinde **tekil** isim
eşleşmesi (yanlış etiketli ama ismi ülke çapında biricik olan ilçeler için) denenir; o da
başarısızsa ve isim ülke genelinde birden fazla ilçeyle çakışıyorsa (ör. Zonguldak'ın ve Konya'nın
ikisinin de "Ereğli" adlı bir ilçesi var), özelliğin kendi merkez noktası her adayın gerçek il
poligonuyla nokta-içinde testinden geçirilir ve yalnızca tam olarak bir aday poligonu içeriyorsa
kabul edilir. Sonuç: 973/973 ilçenin (%100) tamamı gerçek geometriden koordinat aldı; kaynaktaki
tek eşleşmeyen özellik "Περιφερειακή Ενότητα Χίου" (Yunanistan'ın Sakızada bölgesi) — Türkiye'ye
ait olmayan, kaynağın kendi veri hatası olan yabancı bir kayıt, beklenen ve kalıcı bir istisna.
Aynı eşleştirme, `validate-geography.ts`'e ilçe seviyesinde nokta-içinde-poligon kontrolü olarak
da entegre edildi: her ilçenin kendi merkez koordinatı kendi iline ait mi (hata düzeyinde), ve
koordinatı olan her taksi durağı kayıtlı ilçesinin sınırları içinde mi (uyarı düzeyinde,
çünkü ilçe sınırları çok daha dar ve durak koordinatları henüz bu düzeyde hassas değil).

### 2.2 Popüler rotalar

`/rota/` altında yalnızca yol mesafesi isimli, kontrol edilebilir bir kaynaktan doğrulanan 3
güzergâh yayındadır: Antalya Havalimanı ↔ Antalya Merkezi (13 km), Milas-Bodrum Havalimanı ↔
Bodrum Merkezi (36 km), Trabzon Havalimanı ↔ Trabzon Merkezi (7 km). Araştırılan diğer 5
güzergâh (İstanbul Havalimanı ↔ Taksim, Sabiha Gökçen ↔ Kadıköy, Esenboğa ↔ Kızılay, Adnan
Menderes ↔ Konak, Kayseri Havalimanı ↔ merkez) kasıtlı olarak **yayınlanmadı**: kaynaklar
arasında ya gerçek bir çelişki var (İstanbul Havalimanı-Taksim için İETT 50 km derken haber
sentezi 40 km diyor), ya tek kaynak jenerik bir mesafe hesaplayıcısıydı (güvenilmez sınıf), ya
da net bir km rakamı yerine yalnızca belirsiz bir "yaklaşık" ifadesi bulunabildi. Bir sonraki
araştırma turunda bu 5 güzergâh için tek, savunulabilir bir rakama ulaşmak üzere elle (bir kerelik)
bir harita/rota sorgusu yapılması önerilir — spesifikasyonun yasakladığı şey canlı bir routing
API'sine **sitede** bağımlı kalmaktır, tek seferlik insan doğrulaması değil.

### 2.3 Taksi durağı verisi

`/taksi-duraklari/` altında 77 il ve 733 ilçede toplam **8285 taksi durağı** yayındadır:
`/{il}/taksi-duraklari/` il indeksi, `/{il}/{ilce}/taksi-duraklari/` ilçe listesi, ve her durağın
kendi kalıcı sayfası `/{il}/{ilce}/{durak-slug}/` (rakip sitenin URL biçimiyle aynı — her durak
tek başına indexlenebilir, TaxiStand schema.org işaretlemesi taşır). Aynı ilçede aynı isme sahip
75 durak çifti (ör. iki farklı "Merkez Taksi Durağı"), title/description çakışmasını önlemek için
otomatik olarak numaralandırılır ("Merkez Taksi Durağı 2"). Bayburt, Bartın, Iğdır ve Kilis için
kaynakta hiç kayıt yoktu; bu 4 il henüz durak verisi göstermiyor.

**Kaynak ve yöntem:** Bu veri OSM/belediye açık veri portalından değil, kullanıcının
taksi724.com'dan derleyip temizlediği bir CSV dışa aktarımından geldi
(`data/raw/taksi724-duraklari-kaynak.csv`, git-ignored; `scripts/import-taksi724.ts` ile
işlenir). İl/ilçe eşlemesi kaynağın kendi verisiyle %99,98 oranında (8273/8285) doğrudan
örtüştü; kalan 2 kayıt açıkça belgelenmiş bir düzeltmeyle çözüldü: İstanbul'un eski "Eyüp"
adı "Eyüpsultan" ile eşlendi, ve adres alanında "...Kazan, Ankara" yazan tek bir kayıt
(kaynakta yanlışlıkla "İstanbul/Kahramankazan" olarak etiketlenmişti) Ankara/Kahramankazan'a
düzeltildi.

**Veri kalitesi filtreleri (içe aktarma sırasında otomatik uygulanır):** Kaynaktaki
telefon numaralarının bir kısmı, birbiriyle hiçbir ilgisi olmayan onlarca durakta (bazen
8 farklı ilde) birebir aynı şekilde tekrarlanıyordu — bu, gerçek bir paylaşılan çağrı
hattı değil, kaynağın kendi şablon/placeholder verisi olarak değerlendirildi (ör. bir
numara 8 ilde 75 farklı durakta çıktı). Böyle bir numara 5+ durak tarafından paylaşılıyorsa
veya 2+ farklı ilde görülüyorsa, o durağın telefon alanı **boş bırakıldı** (durağın adı,
adresi ve konumu korunarak) — 8285 kayıttan 759'u bu nedenle, ayrıca sabit hat alan kodu
kayıtlı ile uyuşmayan 96 kayıt daha (`data:validate-phones` kontrolüyle, artık doğrulanmış
`landlineAreaCodes` verisine karşı) aynı şekilde boşaltıldı — toplam 855 durakta (%10,3)
yanlış numara göstermektense hiç numara gösterilmiyor. Aynı telefonu paylaşan ama 2-4
durakla sınırlı ve tek il içinde kalan gruplar (muhtemelen gerçek küçük kooperatif/durak
paylaşımları) olduğu gibi bırakıldı.

Bu veri seti belediye veya OSM gibi resmî bir kaynaktan ayrıca doğrulanmamıştır
(`confidenceScore: 50`, `sourceType: manual`); durak taşınmış, kapanmış veya numarası
değişmiş olabilir. `scripts/detect-duplicates.ts` olası mükerrer kayıtları puanlayarak
raporlar (`data/reports/duplicates.json`) — 1273 aday çiftten yalnızca 3'ü inceleme eşiğini
(80 puan) geçti; bunlar yayın engellemez, ileride elle gözden geçirilebilir.

---

## 3. Belgelenmiş Varsayımlar

Proje talimatı, eksik bilgi projeyi durdurmuyorsa güvenli ve geri alınabilir bir varsayım
yapılmasını ve bunun burada belirtilmesini istiyor. Yapılan varsayımlar:

1. **İlçe `officialCode` alanı, resmî bir devlet kaydı olduğu iddiası taşımaz.** Birbirinden
   bağımsız iki kamuya açık il/ilçe veri kümesi karşılaştırılarak derlenmiş dahili, stabil bir
   koddur; join/routing için güvenilirdir ama TÜİK/NVİ resmî ilçe koduyla bire bir eşleştiği
   ayrıca teyit edilmemiştir.
2. **Araç türü olarak varsayılan `yellow` (sarı taksi) tüm illerde kullanıldı**, yalnızca
   İstanbul'a özgü bir etiket olarak değil — Türkiye genelinde ticari taksilerin sarı renkte
   olması yaygın pratik olduğundan, hesaplama aracının varsayılan seçimiyle tutarlı olsun diye
   bu şekilde modellendi. İstanbul'un turkuaz ve 8+1 segmentleri ayrıca `turquoise` /
   `eight-plus-one` olarak eklendi.
3. **Trabzon'un kademeli (0-5 km / 5 km üzeri) kilometre ücreti tek bir orana indirgendi**
   (5 km üzeri oranı kullanıldı) çünkü veri modeli tek bir `pricePerKm` alanı öngörüyor;
   asıl kademeli yapı `sourceDocument` alanında not edilmiştir.
4. **Bölge sınıflandırması** klasik "7 coğrafi bölge" sistemine göre yapılmıştır (Marmara, Ege,
   Akdeniz, İç Anadolu, Karadeniz, Doğu Anadolu, Güneydoğu Anadolu) — TÜİK'in İBBS (NUTS)
   bölgeleri değil, halk arasında yaygın kullanılan klasik sistemdir.
5. **İl/ilçe enlem-boylam alanları, gerçek sınır poligonunun alan-ağırlıklı geometrik merkezini
   (centroid) gösterir** (bkz. bölüm 2.1) — ilin/ilçenin şeklinin matematiksel merkezidir; nüfusun
   yoğunlaştığı nokta veya "şehir merkezi" olarak algılanan yer ile aynı olduğu ayrıca
   doğrulanmamıştır (özellikle uzun/düzensiz kıyı şeridi olan ilçelerde ikisi belirgin şekilde
   farklı olabilir). Site şu an bu alanları haritada göstermek için kullanmıyor; yalnızca
   `scripts/validate-geography.ts`'teki nokta-içinde-poligon doğrulaması bu alanlara dayanıyor.
6. **AdSense yayıncı kimliği (`PUBLIC_ADSENSE_PUB_ID`) yapılandırılmadı.** Reklam bileşenleri
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
/rota/        , /rota/{slug}/        Popüler rota mesafe + tahmini ücret sayfaları (bkz. 2.2)
/rehber/      , /rehber/{slug}/      SSS / rehber makaleleri
/yasal/veri-kaynaklari/            Veri kaynakları ve güncellik yöntemi
/yasal/gizlilik-politikasi/        (noindex)
/yasal/kullanim-sartlari/          (noindex)
/yasal/iletisim/
/taksi-duraklari/                  81 il listesi (durağı olan/olmayan, bkz. 2.3)
/{il}/taksi-duraklari/             İl içindeki ilçelerin durak sayısı listesi (durağı olan 77 il)
/{il}/{ilce}/taksi-duraklari/      İlçedeki durakların listesi (733 ilçe)
/{il}/{ilce}/{durak-slug}/         Tek bir durağın kendi sayfası (8285 durak, TaxiStand schema)
/404
```

Durağı olmayan 4 il (Bayburt, Bartın, Iğdır, Kilis) için `/{il}/taksi-duraklari/` sayfası
**üretilmedi** — spesifikasyonun kendi kuralı gereği ("Sadece 'durak yok' metniyle boş sayfa
üretme"); bu iller yalnızca üst listede "henüz durak verisi olmayan iller" altında görünür.

---

## 7. Veri Güncelleme Akışı

```bash
pnpm data:validate            # Zod + çapraz referans doğrulama (kritik hata build'i durdurur)
pnpm data:validate-phones     # Telefon format/alan kodu/GSM kontrolleri
pnpm data:validate-geography  # Türkiye sınırı, (0,0), aynı koordinat kümesi + gerçek il sınırı poligonu kontrolleri
pnpm data:normalize           # data/normalized/ üretir
pnpm data:duplicates          # Mükerrerlik puanlama (bkz. spec §14.4), data/reports/duplicates.json
pnpm data:change-report       # Son commit'e göre değişiklik özeti + IndexNow URL listesi
pnpm build                    # search-index → astro build → sitemap → internal-link audit → build report
pnpm indexnow:submit          # INDEXNOW_KEY tanımlıysa değişen URL'leri bildirir
```

`pnpm build` tek komutla şu zinciri çalıştırır: arama indeksi → Astro build → sitemap üretimi →
iç bağlantı denetimi → build raporu. Kırık link, orphan sayfa veya tekrarlanan title/description
bulunursa build **başarısız olur** (spec'in "kritik hata build'i durdursun" kuralı).

### Taksi durağı içe aktarma hattı

`scripts/import-taksi724.ts`, `data/raw/taksi724-duraklari-kaynak.csv` (git-ignored — kaynak
dosya değişirse bu script yeniden çalıştırılır) dosyasını `data/source/taxi-stands.csv`'ye
dönüştürür: il/ilçe eşlemesi, kararlı id/slug üretimi, şablon/uyumsuz telefonların temizlenmesi
(bkz. 2.3). Kaynak dosya güncellenirse `npx tsx scripts/import-taksi724.ts` yeniden çalıştırılıp
ardından tam doğrulama zinciri (`data:validate*`, `test`, `build`) tekrar edilmelidir.

`scripts/import-osm.ts` ve `scripts/import-municipal-data.ts` hâlâ kullanılmadı (OSM/belediye
erişimi bu ortamda engelli):

- `import-osm.ts`, gerçek bir Geofabrik Türkiye PBF dosyası ve bir PBF ayrıştırıcı paketi
  (henüz eklenmedi) bekler; dosya yoksa net bir mesajla çıkar.
- `import-municipal-data.ts`, 8 büyükşehir için bir parser kayıt defteri içerir; her parser,
  ilgili açık veri portalının gerçek yanıtı incelenmeden yazılmadığı için şu an hata fırlatır.
- `merge-data.ts` tamamen çalışır durumdadır (alan bazlı önceliklendirme, §12.3) ve bu iki
  script veya gelecekteki başka bir kaynak gerçek aday kayıt ürettiğinde kullanılabilir.

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

Bkz. proje talimatının 41. bölümü. Bu teslimatta henüz karşılanmayan maddeler: hastane/AVM
kümeleri, kalan 5 popüler rota (bkz. 2.2), kalan 40 ilin **resmî kaynaklı** tarife doğrulaması
(şu an tahmini bir rakamla kapatılmış durumdalar — bkz. bölüm 2.4), 4 ilin durak verisi (Bayburt,
Bartın, Iğdır, Kilis — bkz. 2.3), Lighthouse ölçümü (gerçek bir deploy sonrası yapılmalı). Sabit
hat alan kodları, taksi durağı verisi/sayfaları ve il/ilçe merkez koordinatları tamamlandı.
