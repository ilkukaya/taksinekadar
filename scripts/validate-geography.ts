import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";
import { getProvinceById, getActiveProvinces } from "../src/lib/repositories/provinces";
import { getActiveDistricts, getDistrictById } from "../src/lib/repositories/districts";
import {
  loadProvinceBoundaries,
  findBoundaryByIsoCode,
} from "../src/lib/geography/province-boundaries";
import { loadDistrictBoundaries } from "../src/lib/geography/district-boundaries";
import { matchDistrictBoundaries } from "../src/lib/geography/match-district-boundaries";
import { isPointInGeometry } from "../src/lib/geography/point-in-polygon";
import type { PolygonalGeometry } from "../src/lib/geography/point-in-polygon";

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

  // Real district (ilçe) boundary polygons, matched to districts.csv via the same cascade
  // scripts/populate-boundary-centroids.ts uses (see that module's doc comment for the tier
  // list) — reused here, not reimplemented, so both stay in lockstep.
  const provinceGeometryById = new Map<string, PolygonalGeometry>();
  if (boundaries) {
    for (const province of getActiveProvinces()) {
      const boundary = findBoundaryByIsoCode(boundaries, province.officialCode);
      if (boundary) provinceGeometryById.set(province.id, boundary.geometry);
    }
  }

  const districtBoundaries = boundaries ? await loadDistrictBoundaries() : null;
  let districtGeometryById = new Map<string, PolygonalGeometry>();
  if (districtBoundaries) {
    const match = matchDistrictBoundaries(
      getActiveDistricts(),
      getActiveProvinces(),
      districtBoundaries,
      provinceGeometryById,
    );
    districtGeometryById = match.geometryByDistrictId;
    console.log(
      `İlçe sınır poligonları yüklendi (${districtBoundaries.length} özellik, ${districtGeometryById.size} ilçeye eşleşti) — gerçek nokta-içinde testi aktif.`,
    );
    // Exactly one known, expected exception: a stray Greek "Περιφερειακή Ενότητα Χίου"
    // feature in the upstream source that has no Turkish ilçe counterpart (see
    // populate-boundary-centroids.ts). More than one unmatched feature would mean a real
    // Turkish district silently lost its match — worth a warning, not a silent pass.
    if (match.unmatchedBoundaries.length > 1) {
      issues.push({
        level: "warning",
        message: `İlçe sınırı eşleştirmesi ${match.unmatchedBoundaries.length} özelliği eşleştiremedi (beklenen: 1) — yeni bir eşleşmeme olabilir: ${match.unmatchedBoundaries.map((b) => b.name).join(", ")}`,
      });
    }
  } else if (boundaries) {
    console.log(
      "İlçe sınır poligonları yüklenemedi — ilçe seviyesinde nokta-içinde testi atlanacak.",
    );
  }

  // Every district's own centroid (populated by populate-boundary-centroids.ts) should fall
  // within its own province's polygon — a cheap, comprehensive sanity check on the district
  // boundary match itself, independent of how many taxi stands happen to have coordinates.
  if (boundaries) {
    for (const district of getActiveDistricts()) {
      if (district.latitude === undefined || district.longitude === undefined) continue;
      const province = getProvinceById(district.provinceId);
      const geometry = province ? provinceGeometryById.get(province.id) : undefined;
      if (!geometry) continue;
      const isInside = isPointInGeometry([district.longitude, district.latitude], geometry);
      if (!isInside) {
        issues.push({
          level: "error",
          message: `İlçe "${district.name}" (${district.id}): merkez koordinatı, kayıtlı ili olan ${province!.name} sınırları dışında görünüyor (${district.latitude}, ${district.longitude}).`,
        });
      }
    }
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
    if (boundary) {
      const isInside = isPointInGeometry([longitude, latitude], boundary.geometry);
      if (!isInside) {
        issues.push({
          level: "error",
          message: `Durak "${stand.name}" (${stand.id}): koordinat, kayıtlı ili olan ${province!.name} sınırları dışında görünüyor (${latitude}, ${longitude}).`,
        });
      }
    }

    // District-level containment is a warning, not an error: ilçe borders are far thinner
    // than il borders, so a stand near a shared edge can legitimately fall a few meters
    // across it without the underlying data being wrong.
    const districtGeometry = districtGeometryById.get(stand.districtId);
    if (districtGeometry) {
      const district = getDistrictById(stand.districtId);
      const isInsideDistrict = isPointInGeometry([longitude, latitude], districtGeometry);
      if (!isInsideDistrict) {
        issues.push({
          level: "warning",
          message: `Durak "${stand.name}" (${stand.id}): koordinat, kayıtlı ilçesi olan ${district?.name ?? stand.districtId} sınırları dışında görünüyor (${latitude}, ${longitude}).`,
        });
      }
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

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
