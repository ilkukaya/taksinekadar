# Taksi Ne Kadar? — Yayın, SEO ve Gelir Rehberi

Bu rehber, teknik bilgi gerektirmeden siteyi **tamamen canlıya almak**, **Google'da görünür
olmak** ve **reklam + affiliate geliri** elde etmek için senin yapman gereken adımları sırayla
anlatır. Kod tarafında yapılabilecek her şey yapıldı; aşağıdakiler yalnızca senin hesabınla
yapılabilen işlemlerdir (alan adı satın alma, Google/AdSense hesabı vb.).

> **Nasıl ayar girilir?** Bu rehberde "Netlify'a şu değişkeni ekle" dediğim her yerde:
> [app.netlify.com](https://app.netlify.com) → **taksinekadar** projesi → **Project configuration**
> → **Environment variables** → **Add a variable**. Anahtarı (ör. `PUBLIC_ADSENSE_PUB_ID`) ve
> değeri yapıştır, kaydet. Sonra **Deploys → Trigger deploy → Deploy site** ile siteyi yeniden
> yayınla. Değişkenin etkisi ancak yeni yayından sonra görünür.

---

## Durum özeti

| Konu                                                                                    | Durum                    |
| --------------------------------------------------------------------------------------- | ------------------------ |
| Site yayında (taksinekadar.netlify.app)                                                 | ✅                       |
| Yeni tasarım (mobil + masaüstü), yeni logo, sosyal medya görselleri                     | ✅                       |
| Canlı hesaplama, paylaşılabilir hesap bağlantısı (`?il=istanbul&km=10`)                 | ✅                       |
| 81 il sayfası + SSS şeması, 8.285 durak sayfası, 15 rehber yazısı                       | ✅                       |
| Teknik SEO: canonical, sitemap, robots, Open Graph, hreflang, yapılandırılmış veri      | ✅                       |
| AEO/GEO: SSS (FAQPage) şemaları, `llms.txt`, `llms-full.txt`, yapay zekâ botlarına izin | ✅                       |
| Güvenlik ve önbellek başlıkları (Netlify)                                               | ✅                       |
| Reklam ve affiliate altyapısı (ayar girilince otomatik açılır)                          | ✅ Hazır, hesap bekliyor |
| Özel alan adı (taksinekadar.com)                                                        | ⏳ Senin adımın — Adım 1 |
| Google Search Console / Bing / Yandex                                                   | ⏳ Senin adımın — Adım 2 |
| AdSense başvurusu                                                                       | ⏳ Senin adımın — Adım 4 |
| Affiliate üyelikleri                                                                    | ⏳ Senin adımın — Adım 5 |

---

## Adım 1 — Alan adını bağla (en önemli adım)

Şu an site `taksinekadar.netlify.app` adresinde çalışıyor. Sitenin tüm SEO etiketleri otomatik
olarak **Netlify'daki birincil adresi** takip eder; alan adını bağladığın anda bir sonraki
yayında hepsi kendiliğinden `taksinekadar.com`'a geçer. Senin ayrıca kod değiştirmen gerekmez.

1. `taksinekadar.com` alan adı sende değilse bir kayıt firmasından al (ör. Natro, İsimtescil,
   Cloudflare Registrar, Namecheap). Yıllık ücreti vardır — bu listedeki tek zorunlu masraftır.
2. Netlify → proje → **Domain management** → **Add a domain** → `taksinekadar.com` yaz.
3. Netlify sana DNS ayarlarını gösterir. En kolayı: **Netlify DNS** seçip verilen 4 "name server"
   adresini alan adını aldığın firmanın panelinde "DNS/Nameserver değiştir" bölümüne yapıştırmak.
4. `www.taksinekadar.com` da eklensin, **birincil (primary) alan adı `taksinekadar.com`** olsun
   (www'suz). Netlify ücretsiz SSL (https) sertifikasını kendisi kurar.
5. DNS yayılması birkaç saat sürebilir. Sonra **Deploys → Trigger deploy** ile bir kez yeniden
   yayınla. `https://taksinekadar.com/robots.txt` açıldığında en altta
   `Sitemap: https://taksinekadar.com/sitemap-index.xml` görüyorsan her şey tamam.

**E-posta:** İletişim sayfasında `iletisim@taksinekadar.com` görünür. Ücretsiz yönlendirme için
[ImprovMX](https://improvmx.com) veya Cloudflare Email Routing ile bu adresi kendi Gmail'ine
yönlendirebilirsin. O zamana kadar farklı bir adres göstermek istersen Netlify'a
`PUBLIC_CONTACT_EMAIL` değişkenini ekle.

---

## Adım 2 — Arama motorlarına tanıt (ücretsiz)

### Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → **Mülk ekle**
   → **URL öneki** → `https://taksinekadar.com/`.
2. Doğrulama yöntemi olarak **HTML etiketi**'ni seç. Sana
   `<meta name="google-site-verification" content="ABC123..." />` gibi bir kod verir.
3. Sadece `content="..."` içindeki değeri kopyala → Netlify'a
   `PUBLIC_GOOGLE_SITE_VERIFICATION` olarak ekle → yeniden yayınla → Search Console'da **Doğrula**.
4. Sol menü **Site haritaları** → `sitemap-index.xml` yaz → **Gönder**.
5. İlk günlerde **URL denetimi** ile ana sayfayı, `/tarifeler/` ve birkaç büyük il sayfasını
   (İstanbul, Ankara, İzmir) tek tek "Dizine eklenmesini iste" ile gönder.

### Bing Webmaster Tools (Bing + ChatGPT arama + Copilot + DuckDuckGo)

1. [bing.com/webmasters](https://www.bing.com/webmasters) → Google Search Console'dan **içe aktar**
   (en kolayı) veya meta etiketiyle doğrula: değeri `PUBLIC_BING_SITE_VERIFICATION` olarak ekle.
2. Sitemap'i gönder. ChatGPT'nin web araması büyük ölçüde Bing dizinini kullanır — GEO için önemli.

### Yandex Webmaster (Türkiye'de ciddi pay)

1. [webmaster.yandex.com](https://webmaster.yandex.com) → site ekle → meta etiket yöntemi →
   değeri `PUBLIC_YANDEX_VERIFICATION` olarak ekle → doğrula → sitemap gönder.

### IndexNow (Bing/Yandex'e anında bildirim)

Anahtar Netlify'a eklendi (`INDEXNOW_KEY`). Alan adı bağlandıktan sonra bir geliştirici
`pnpm build && pnpm indexnow:submit` çalıştırarak tüm sayfaları tek seferde bildirebilir.

### Google İşletme Profili

Bu site fiziksel bir işletme olmadığı için gerekmez; ekleme.

---

## Adım 3 — Ziyaretçi istatistikleri (ücretsiz)

**Önerilen: Cloudflare Web Analytics** — ücretsiz, çerez kullanmaz, çerez onayı gerektirmez.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → ücretsiz hesap → **Analytics & Logs →
   Web Analytics** → **Add a site** → `taksinekadar.com`.
2. "JS snippet" seçeneğinde görünen `token` değerini kopyala →
   Netlify'a `PUBLIC_CF_BEACON_TOKEN` olarak ekle → yeniden yayınla.

İsteğe bağlı: Google Analytics 4 (`PUBLIC_GA4_ID`, `G-...` ile başlar). GA4 açılırsa sitede
kısa bir çerez bildirimi otomatik olarak gösterilir.

---

## Adım 4 — Google AdSense (reklam geliri)

AdSense onayı için sitenin gerçek alan adında yayında olması, özgün içerik, gizlilik politikası,
hakkımızda ve iletişim sayfaları gerekir — **bunların hepsi hazır**. Adım 1'i bitirip 1-2 hafta
Search Console'da indekslenmeyi gözledikten sonra başvur.

1. [adsense.google.com](https://adsense.google.com) → `taksinekadar.com` ile başvur.
2. AdSense yayıncı kimliğini (`ca-pub-1234567890123456`) Netlify'a `PUBLIC_ADSENSE_PUB_ID`
   olarak ekle → yeniden yayınla. Bu tek adım:
   - AdSense kodunu tüm sayfalara ekler (onay incelemesi için gerekli),
   - `https://taksinekadar.com/ads.txt` dosyasını otomatik oluşturur,
   - gizlilik politikasındaki çerez bildirimini ve sitedeki kısa çerez uyarısını açar.
3. Onay gelince AdSense'te **Otomatik reklamlar**'ı aç. İlk ay en kolay ve genelde yeterli yol budur.
4. (İsteğe bağlı, daha yüksek gelir) AdSense → **Reklamlar → Reklam birimine göre** → "Görüntülü
   reklam" birimleri oluştur. Her birimin kodundaki `data-ad-slot="1234567890"` sayısını ilgili
   değişkene yaz:
   - `PUBLIC_ADSENSE_SLOT_AFTER_CALCULATOR` — hesaplama sonucunun hemen altı (en değerli yer)
   - `PUBLIC_ADSENSE_SLOT_IN_CONTENT` — il ve rehber sayfalarının ortası
   - `PUBLIC_ADSENSE_SLOT_MOBILE_STICKY` — mobilde ekranın altına sabit küçük reklam
5. Avrupa'dan gelen ziyaretçiler için Google, onaylı bir çerez onay yönetimi (CMP) ister. AdSense →
   **Gizlilik ve mesajlaşma** → **Avrupa düzenlemeleri** mesajını ücretsiz olarak açman yeterli.

**Beklenti:** Türkiye trafiğinde bin gösterim başına gelir (RPM) düşüktür; gelir ziyaretçi sayısıyla
doğru orantılıdır. Bu yüzden asıl hedef önce trafik (Adım 2 ve 6), sonra affiliate (Adım 5).

---

## Adım 5 — Affiliate (iş ortaklığı) geliri

Site, en yüksek niyetli ziyaretçilerin (havalimanı, otogar, şehir sayfaları) önüne otomatik olarak
**"İş ortağı bağlantısı"** etiketli kartlar koyacak şekilde hazırlandı. Kartlar, sen bağlantı
girene kadar görünmez. Her kart `rel="sponsored"` ile Google kurallarına uygundur.

| Kart                 | Nerede görünür                                      | Önerilen programlar (başvuru ücretsiz)                                                 | Netlify değişkeni                 |
| -------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| Havalimanı transferi | Havalimanı sayfaları, ana sayfa, büyük il sayfaları | Travelpayouts (GetTransfer, Kiwitaxi, Welcome Pickups, Intui), Booking.com Taxi (Awin) | `PUBLIC_AFFILIATE_TRANSFER_URL`   |
| Araç kiralama        | İl, havalimanı sayfaları                            | Travelpayouts (DiscoverCars, Localrent), Rentalcars (Awin/CJ)                          | `PUBLIC_AFFILIATE_CAR_RENTAL_URL` |
| Otel                 | İl, havalimanı, otogar sayfaları                    | Booking.com Affiliate Partner, Travelpayouts (Hotellook), Agoda                        | `PUBLIC_AFFILIATE_HOTEL_URL`      |
| Otobüs bileti        | Otogar sayfaları ve havalimanı olmayan iller        | Obilet / Enuygun ortaklık programları (başvuru ile), Travelpayouts                     | `PUBLIC_AFFILIATE_BUS_URL`        |

**En kolay başlangıç:** [Travelpayouts](https://www.travelpayouts.com) tek hesapla transfer, araç
kiralama ve otel programlarını birlikte verir. Programa katıl → ilgili markanın "link oluşturucu"su
ile Türkiye/İstanbul için bir takip bağlantısı üret → yukarıdaki değişkene yapıştır. Kartta görünen
kısa adı değiştirmek istersen `..._NAME` değişkenlerini kullan (ör. `PUBLIC_AFFILIATE_TRANSFER_NAME`).

---

## Adım 6 — Trafik büyütme (ücretsiz, sürekli)

1. **Tarifeleri güncel tut.** Siteye güveni ve Google sıralamasını en çok bu belirler. Bir ilde
   zam haberi çıktığında `data/source/tariffs.csv` güncellenmeli (bana "şu ilin yeni tarifesi
   şu, kaynak şu" demen yeterli).
2. **Tahmini 39 ili doğrula.** Her doğrulanan il, sayfaya "Doğrulanmış tarife" rozeti ve daha
   güçlü bir sıralama getirir.
3. **Sosyal medya.** Her il için hazır paylaşım görseli var (`/og/istanbul.jpg` gibi). Zam
   dönemlerinde "İstanbul'da taksi ne kadar oldu?" gibi paylaşımlar ve hesap bağlantısı
   (`https://taksinekadar.com/taksi-ucreti-hesaplama/?il=istanbul&km=10`) çok iyi çalışır.
4. **Ekşi Sözlük, Reddit (r/Turkey, r/istanbul), Donanımhaber** gibi yerlerde soru soranlara
   ilgili il sayfasını kaynak olarak göstermek doğal bağlantı (backlink) kazandırır.
5. **Yeni rehber yazıları.** "X havalimanından Y'ye taksi" gibi mesafesi doğrulanmış rotalar,
   uzun kuyruklu aramalarda hızlı trafik getirir.

---

## Teknik not: Netlify ve GitHub

- Netlify, GitHub'daki `claude/taksinekadar-repo-wuzygd` dalını **production** olarak yayınlıyor.
  İleride daha düzenli olsun istersen GitHub'da `main` adında bir dal açıp Netlify →
  **Project configuration → Build & deploy → Branches** bölümünden production dalını `main`
  yapabilirsin. Zorunlu değildir.
- Her yayın öncesi otomatik kontroller çalışır: veri doğrulama, 125+ birim test, kırık link /
  yetim sayfa / tekrar eden başlık kontrolü. Bir hata varsa site bozuk hâliyle yayınlanmaz, eski
  sürüm yayında kalır.
- Marka görsellerini (logo, ikonlar, paylaşım görselleri) yeniden üretmek için:
  `node scripts/generate-brand-assets.mjs`.
