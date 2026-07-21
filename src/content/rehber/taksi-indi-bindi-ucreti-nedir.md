---
title: "Taksi İndi-Bindi Ücreti Nedir?"
description: "İndi-bindi ücretinin ne anlama geldiğini, minimum ücretten farkını ve kısa mesafelerde neden bu tutarın ödendiğini anlatıyoruz."
publishedAt: "2026-07-21"
updatedAt: "2026-07-21"
sourceName: "Taksi Ne Kadar? editör ekibi"
editorNote: "İl bazlı güncel indi-bindi tutarları için ilgili il tarife sayfasına bakın."
relatedGuides:
  - "taksi-ucreti-nasil-hesaplanir"
  - "taksi-acilis-ucreti-nedir"
---

"İndi-bindi ücreti", bir taksi yolculuğunda ödenecek **minimum tutarı** ifade eden, günlük
konuşmada yaygın kullanılan bir terimdir. Taksiye binip çok kısa bir mesafe gittiğinizde bile,
taksimetrenin gösterdiği tutar bu minimum seviyenin altında kalıyorsa, sürücüye bu minimum tutar
ödenir.

## Neden var?

Bir taksi yolculuğu; sürücünün yakıt, zaman ve aracı o an başka bir yolcuya tahsis edememe maliyetini
içerir. Çok kısa mesafelerde salt kilometre ücreti bu maliyeti karşılamayabileceğinden, belediyeler
(veya UKOME) her yolculuk için bir taban ücret — indi-bindi ücreti — belirler.

## Minimum ücretten farkı var mı?

Pratikte "indi-bindi ücreti" ve "minimum ücret" aynı kavramı karşılar: taksimetrenin
göstermesi gereken en düşük tutar. Bu sitede hesaplama motoru bu değeri `minimumFare` alanı
olarak tutar ve şu kuralı uygular:

```
tahmini_tutar = max(açılış_ücreti + mesafe_bedeli + bekleme_bedeli, minimum_ücret)
```

Yani hesaplanan tutar minimum ücretin altında kalırsa, sonuç olarak minimum ücret gösterilir.

## İllere göre değişir mi?

Evet. Her il kendi indi-bindi/minimum ücretini ayrı belirler ve bu tutar zam dönemlerinde diğer
kalemlerle birlikte güncellenir. Güncel ve kaynaklı rakamlar için ilgili
[il tarife sayfasına](/tarifeler/) bakın; kaynağı doğrulanmamış bir ilde bu sitede tutar
gösterilmez, bunun yerine "tarife henüz doğrulanmadı" ibaresi yer alır.
