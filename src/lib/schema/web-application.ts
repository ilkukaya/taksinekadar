import { canonicalUrl } from "../../config/site";

export function buildCalculatorWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Taksi Ücreti Hesaplama Aracı",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    url: canonicalUrl("/taksi-ucreti-hesaplama/"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
  };
}
