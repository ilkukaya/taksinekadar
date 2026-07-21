/**
 * Phase 2 pipeline: per-city parsers for municipal open-data taxi stand datasets.
 *
 * Each city publishes its open data in its own shape (CSV/JSON/ArcGIS layer, different
 * column names), so this uses a registry of one parser per city rather than a single
 * generic parser. None of the parsers below are implemented yet: writing a parser against
 * a response shape nobody has fetched and inspected in this session would be a guess
 * dressed up as an integration. The registry/dispatch structure is real and ready — only
 * the per-city field mapping needs to be filled in once each portal's actual export is
 * fetched and inspected.
 */
import type { TaxiStandSourceType } from "../src/lib/validation/enums";

export type MunicipalStandCandidate = {
  sourceRecordId: string;
  name: string;
  address?: string;
  phonePrimary?: string;
  latitude?: number;
  longitude?: number;
  districtName?: string;
};

export type MunicipalParser = {
  cityLabel: string;
  provinceId: string;
  sourceType: TaxiStandSourceType;
  sourceName: string;
  /** Open data portal URL — filled in per city once confirmed reachable. */
  datasetUrl: string;
  parse: (raw: unknown) => MunicipalStandCandidate[];
};

function notYetImplemented(cityLabel: string): MunicipalParser["parse"] {
  return () => {
    throw new Error(
      `${cityLabel} için parser henüz uygulanmadı — gerçek açık veri kaynağı incelenmeden yazılamaz.`,
    );
  };
}

export const MUNICIPAL_PARSERS: MunicipalParser[] = [
  {
    cityLabel: "İstanbul",
    provinceId: "34",
    sourceType: "open-data",
    sourceName: "İBB Açık Veri Portalı",
    datasetUrl: "https://data.ibb.gov.tr",
    parse: notYetImplemented("İstanbul"),
  },
  {
    cityLabel: "Ankara",
    provinceId: "06",
    sourceType: "open-data",
    sourceName: "Ankara Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://acikveri.ankara.bel.tr",
    parse: notYetImplemented("Ankara"),
  },
  {
    cityLabel: "İzmir",
    provinceId: "35",
    sourceType: "open-data",
    sourceName: "İzmir Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://acikveri.bizizmir.com",
    parse: notYetImplemented("İzmir"),
  },
  {
    cityLabel: "Antalya",
    provinceId: "07",
    sourceType: "open-data",
    sourceName: "Antalya Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://acikveri.antalya.bel.tr",
    parse: notYetImplemented("Antalya"),
  },
  {
    cityLabel: "Bursa",
    provinceId: "16",
    sourceType: "open-data",
    sourceName: "Bursa Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://www.bursa.bel.tr",
    parse: notYetImplemented("Bursa"),
  },
  {
    cityLabel: "Kocaeli",
    provinceId: "41",
    sourceType: "open-data",
    sourceName: "Kocaeli Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://www.kocaeli.bel.tr",
    parse: notYetImplemented("Kocaeli"),
  },
  {
    cityLabel: "Muğla",
    provinceId: "48",
    sourceType: "open-data",
    sourceName: "Muğla Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://www.mugla.bel.tr",
    parse: notYetImplemented("Muğla"),
  },
  {
    cityLabel: "Balıkesir",
    provinceId: "10",
    sourceType: "open-data",
    sourceName: "Balıkesir Büyükşehir Belediyesi Açık Veri Portalı",
    datasetUrl: "https://www.balikesir.bel.tr",
    parse: notYetImplemented("Balıkesir"),
  },
];

async function main() {
  console.log(
    `${MUNICIPAL_PARSERS.length} belediye kayıtlı, ancak henüz hiçbiri uygulanmadı. ` +
      "Her şehir için gerçek açık veri kaynağı incelendikten sonra parse() fonksiyonu doldurulmalıdır.",
  );
}

main();
