import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";

/**
 * Turkey's rough bounding box (mirrors the Zod schema check — this script re-checks and
 * additionally reports, since schema failures throw during CSV load rather than collecting
 * a report). True province/district polygon containment needs real boundary GeoJSON, which
 * this project doesn't have yet — that check is deferred to Phase 2 alongside real stand data.
 */
const TURKEY_LAT_RANGE = [35.8, 42.2] as const;
const TURKEY_LON_RANGE = [25.5, 44.9] as const;
const SAME_COORDINATE_CLUSTER_THRESHOLD = 3;

type GeoIssue = { level: "error" | "warning"; message: string };

function main() {
  const issues: GeoIssue[] = [];
  const stands = getAllTaxiStands();
  const withCoordinates = stands.filter(
    (s) => s.latitude !== undefined && s.longitude !== undefined,
  );

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
    "Not: İl/ilçe sınır poligonu ile nokta-içinde testi, gerçek sınır verisi (GeoJSON) eklenene kadar Faz 2'ye ertelenmiştir.",
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
