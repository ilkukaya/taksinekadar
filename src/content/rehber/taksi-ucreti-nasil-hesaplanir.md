---
title: "Taksi Ücreti Nasıl Hesaplanır?"
description: "Türkiye'de taksi ücretinin açılış ücreti, kilometre ücreti, bekleme süresi ve minimum ücretten nasıl oluştuğunu adım adım açıklıyoruz."
publishedAt: "2026-07-21"
updatedAt: "2026-07-21"
sourceName: "Taksi Ne Kadar? editör ekibi"
editorNote: "Bu rehber genel hesaplama mantığını anlatır; il bazlı güncel rakamlar için ilgili il tarife sayfasına bakın."
relatedGuides:
  - "taksi-indi-bindi-ucreti-nedir"
  - "taksimetre-nasil-calisir"
  - "taksi-acilis-ucreti-nedir"
---

Türkiye'de ticari taksilerin ücreti, belediyeler (büyükşehirlerde UKOME — Ulaşım Koordinasyon
Merkezi) tarafından belirlenen bir tarifeye göre taksimetre ile hesaplanır. Bu tarife dört ana
bileşenden oluşur: **açılış ücreti**, **kilometre ücreti**, **minimum (indi-bindi) ücret** ve
genellikle **bekleme ücreti**.

## Hesaplamanın adımları

1. **Açılış ücreti**: Taksimetre çalıştırıldığı anda, hiç yol alınmadan önce sayaçta görünen
   sabit tutardır.
2. **Mesafe bedeli**: Kat edilen kilometre, o il için belirlenmiş kilometre ücretiyle çarpılır.
3. **Bekleme bedeli**: Taksi trafikte veya yolcunun talebiyle beklerse, geçen dakika sayısı
   dakika başına bekleme ücretiyle çarpılarak eklenir.
4. **Ek geçiş ücreti**: Güzergâh üzerinde köprü, otoyol gibi ücretli geçişler varsa bu tutar
   ayrıca eklenir (bkz. "Köprü ücretini kim öder?").
5. **Minimum ücret kontrolü**: Yukarıdaki toplam, o il için belirlenmiş minimum (indi-bindi)
   ücretin altında kalıyorsa, yolcudan minimum ücret tahsil edilir.

Özetle:

```
mesafe_tutarı = mesafe_km × kilometre_ücreti
bekleme_tutarı = bekleme_dakikası × dakika_bekleme_ücreti
ham_tutar = açılış_ücreti + mesafe_tutarı + bekleme_tutarı + ek_geçiş_ücreti
tahmini_tutar = max(ham_tutar, minimum_ücret)
```

## Neden "tahmini" diyoruz?

Bu sitedeki hesaplama aracı, girdiğiniz mesafe ve süreye göre bir **tahmin** üretir. Gerçek
taksimetre tutarı; trafik yoğunluğu, seçilen güzergâh, kavşaklarda bekleme ve olası ücretli geçişler
nedeniyle hesaplanan tahminden farklı çıkabilir. Kesin tutar için taksimetreye güvenin; bu araç
yalnızca yola çıkmadan önce yaklaşık bir fikir vermek içindir.

## Şehirden şehre neden farklı?

Her il (büyükşehirlerde ilgili UKOME, diğer illerde belediye meclisi/esnaf odası) kendi tarifesini
ayrı belirler. Bu yüzden aynı mesafe, örneğin İstanbul ile daha küçük bir il arasında farklı ücrete
denk gelebilir. Güncel ve kaynaklı rakamlar için [il tarife sayfalarımıza](/tarifeler/) bakabilirsiniz.
