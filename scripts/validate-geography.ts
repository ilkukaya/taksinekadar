import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";
import { getProvinceById } from "../src/lib/repositories/provinces";
import {
  loadProvinceBoundaries,
  findBoundaryByIsoCode,
} from "../src/lib/geography/province-boundaries";
import { isPointInGeometry } from "../src/lib/geography/point-in-polygon";

/**
 * Turkey's rough bounding box — always checked first, regardless of whether real
 * boundary polygons are available (see below).
 */
const TURKEY_LAT_RANGE = [35.8, 42.2] as const;
const TURKEY_LON_RANGE = [25.5, 44.9] as const;
const SAME_COORDINATE_CLUSTER_THRESHOLD = 3;

type GeoIssue = { level: "error" | "warning"; message: string };

async function main() {
  const issues: GeoIssue[] = [];
  const stands = getAllTaxiStands();
  const withCoordinates = stands.filter(
    (s) => s.latitude !== undefined && s.longitude !== undefined,
  );

  // Real province boundary polygons (OSM via geojsons-of-turkey, ODbL — see
  // /yasal/veri-kaynaklari/). Falls back to the bounding-box-only check below if the
  // source can't be reached (e.g. no network in this environment) — never hard-fails
  // the pipeline over a missing third-party dataset.
  const boundaries = await loadProvinceBoundaries();
  if (boundaries) {
    console.log(
      `İl sınır poligonları yüklendi (${boundaries.length} il) — gerçek nokta-içinde testi aktif.`,
    );
  } else {
    console.log(
      "İl sınır poligonları yüklenemedi — yalnızca Türkiye geneli bounding-box kontrolü yapılacak.",
    );
  }

  for (const stand of withCoordinates) {
    const { latitude, longitude } = stand as { latitude: number; longitude: number };

    if (latitude === 0 && longitude === 0) {
      issues.push({
        level: "error",
        message: `Durak "${stand.name}" (${stand.id}): koordinat (0,0) — muhtemelen eksik veri.`,
      });
      continue;
    }

    if (
      latitude < TURKEY_LAT_RANGE[0] ||
      latitude > TURKEY_LAT_RANGE[1] ||
      longitude < TURKEY_LON_RANGE[0] ||
      longitude > TURKEY_LON_RANGE[1]
    ) {
      issues.push({
        level: "error",
        message: `Durak "${stand.name}" (${stand.id}): koordinat Türkiye sınırları dışında (${latitude}, ${longitude}).`,
      });
      continue;
    }

    if (!boundaries) continue;

    const province = getProvinceById(stand.provinceId);
    const boundary = province
      ? findBoundaryByIsoCode(boundaries, province.officialCode)
      : undefined;
    if (!boundary) continue; // no matching polygon found for this province — skip, don't guess

    const isInside = isPointInGeometry([longitude, latitude], boundary.geometry);
    if (!isInside) {
      issues.push({
        level: "error",
        message: `Durak "${stand.name}" (${stand.id}): koordinat, kayıtlı ili olan ${province!.name} sınırları dışında görünüyor (${latitude}, ${longitude}).`,
      });
    }
  }

  const coordinateGroups = new Map<string, string[]>();
  for (const stand of withCoordinates) {
    const key = `${stand.latitude!.toFixed(5)},${stand.longitude!.toFixed(5)}`;
    const group = coordinateGroups.get(key) ?? [];
    group.push(stand.id);
    coordinateGroups.set(key, group);
  }
  for (const [coordinate, standIds] of coordinateGroups) {
    if (standIds.length >= SAME_COORDINATE_CLUSTER_THRESHOLD) {
      issues.push({
        level: "warning",
        message: `Aynı koordinatta (${coordinate}) ${standIds.length} durak: ${standIds.join(", ")}`,
      });
    }
  }

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  for (const issue of warnings) console.warn(`UYARI: ${issue.message}`);
  for (const issue of errors) console.error(`HATA: ${issue.message}`);

  console.log(
    `\nCoğrafi doğrulama: ${withCoordinates.length}/${stands.length} durakta koordinat var, ${errors.length} hata, ${warnings.length} uyarı.`,
  );
  console.log(
    "Not: İlçe sınırı ile nokta-içinde testi (yalnızca il seviyesi değil) için ilçe poligonları henüz entegre edilmedi; aynı kaynakta admin_level=6 dosyası mevcut, ilçe id eşlemesi netleştiğinde eklenebilir.",
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
