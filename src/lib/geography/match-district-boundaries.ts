import type { DistrictBoundary } from "./district-boundaries";
import { computeCentroid } from "./polygon-centroid";
import { isPointInGeometry } from "./point-in-polygon";
import type { PolygonalGeometry } from "./point-in-polygon";

export type MatchableDistrict = { id: string; provinceId: string; name: string };
export type MatchableProvince = { id: string; name: string; plateCode: number };

export type DistrictBoundaryMatchResult = {
  /** Real boundary geometry matched to each district, keyed by district id. */
  geometryByDistrictId: Map<string, PolygonalGeometry>;
  /** How each district's match was found — see resolveMatch's doc comment for the tier cascade. */
  tierByDistrictId: Map<string, string>;
  /**
   * Boundary features that couldn't be attributed to any district. Expected to always include
   * at least the upstream source's stray "Περιφερειακή Ενότητα Χίου" feature — a Greek
   * administrative unit, not a Turkish ilçe — so an empty list is not the success condition;
   * exactly-one-unmatched (that one) is.
   */
  unmatchedBoundaries: DistrictBoundary[];
};

function normalizeName(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/\(.*?\)/g, "")
    .replace(/['’]/g, "")
    .replace(/ı/g, "i")
    .replace(/î/g, "i")
    .replace(/â/g, "a")
    .replace(/û/g, "u")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * The boundary source spells a small number of district names differently from our own
 * reference data — genuine alternate names of the same real administrative unit, verified
 * individually, not a fabrication. Applied to the boundary-side name only.
 */
const BOUNDARY_NAME_ALIASES: Record<string, string> = {
  // Samsun's "19 Mayıs" ilçe (named for 19 May 1919); the source spells it out as a word.
  ondokuzmayis: "19mayis",
  // Denizli's "Baklan" ilçe: the only Denizli boundary feature with no exact/fuzzy match is
  // "Balkan" (two letters swapped). Confirmed this is the same real district, not a duplicate
  // of neighboring "Buldan" — Buldan already has its own separately, exactly-matched feature
  // elsewhere in this same source, so it doesn't need (and isn't) this one.
  balkan: "baklan",
};

/** Strips a trailing "merkez"/"merkezi" word some boundary features use for a province's central district. */
function stripMerkezSuffix(normalized: string): string | null {
  if (normalized.endsWith("merkezi")) return normalized.slice(0, -"merkezi".length);
  if (normalized.endsWith("merkez")) return normalized.slice(0, -"merkez".length);
  return null;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i]![0] = i;
  for (let j = 0; j < cols; j++) dp[0]![j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[rows - 1]![cols - 1]!;
}

/** The single closest candidate within `maxDistance`, or undefined if none qualify or two tie. */
function findUniqueFuzzyMatch<T>(
  normalized: string,
  candidates: Map<string, T>,
  maxDistance: number,
): T | undefined {
  let best: { value: T; distance: number } | undefined;
  let tied = false;
  for (const [name, value] of candidates) {
    const distance = levenshtein(normalized, name);
    if (distance > maxDistance) continue;
    if (!best || distance < best.distance) {
      best = { value, distance };
      tied = false;
    } else if (distance === best.distance) {
      tied = true;
    }
  }
  return tied ? undefined : best?.value;
}

/**
 * Resolves a single district boundary feature to a district through a cascade of increasingly
 * cautious fallbacks, each gated by an unambiguous signal (never a guess):
 *
 *  1. Exact name match within the boundary's own tagged province.
 *  2/2c. Same pattern, after stripping a "merkez" ilçe-seat naming convention (either as a
 *     "(merkez)"/"(Merkez İlçe)" parenthetical already removed by normalizeName, or an
 *     "{il} merkez"/"merkezi" suffix) — mapped to that province's own "Merkez" district, or
 *     (rare) to a sibling district whose own name the suffix reveals (e.g. "Gediz Merkez").
 *  2b. A small (≤2 edit distance) same-province typo tolerance, only accepted if exactly one
 *     district is that close — recovers genuine source spelling slips without risking a
 *     cross-district mismatch.
 *  3/3b. Nationwide fallbacks for when the boundary's province tag itself is wrong (confirmed
 *     upstream data errors: e.g. every Kırşehir district tagged with Kocaeli's network code,
 *     several Mersin districts tagged with Hatay's) — accepted only when the name (or, after
 *     stripping "merkez", a province name) is unique across all 81 provinces.
 *  4. A last resort for names that collide nationwide (e.g. two districts named "Ereğli", one
 *     genuinely in Zonguldak and one in Konya): the feature's own centroid is tested against
 *     each candidate's real province polygon, and accepted only if exactly one contains it —
 *     pure geometry, not a naming guess.
 */
function resolveMatch(
  boundary: DistrictBoundary,
  districtsByProvincePlate: Map<string, Map<string, MatchableDistrict>>,
  districtsByNameNationwide: Map<string, MatchableDistrict[]>,
  provinceByPlate: Map<string, MatchableProvince>,
  provinceByNormalizedName: Map<string, MatchableProvince>,
  provinceGeometryById: Map<string, PolygonalGeometry>,
): { district: MatchableDistrict; tier: string } | undefined {
  const normalized = normalizeName(boundary.name);
  const aliased = BOUNDARY_NAME_ALIASES[normalized] ?? normalized;
  const scopedMap = boundary.plateCode
    ? districtsByProvincePlate.get(boundary.plateCode)
    : undefined;

  if (scopedMap) {
    const direct = scopedMap.get(aliased);
    if (direct) return { district: direct, tier: "aynı plaka, doğrudan eşleşme" };

    const stripped = stripMerkezSuffix(aliased);
    const candidateName = stripped ?? aliased;
    const province = provinceByPlate.get(boundary.plateCode!);
    if (province && normalizeName(province.name) === candidateName) {
      const merkez = scopedMap.get("merkez");
      if (merkez) return { district: merkez, tier: "aynı plaka, il merkezi kalıbı" };
    }
    if (stripped !== null) {
      const sibling = scopedMap.get(stripped);
      if (sibling) return { district: sibling, tier: "aynı plaka, merkez eki temizlenmiş isim" };
    }

    const fuzzy = findUniqueFuzzyMatch(aliased, scopedMap, 2);
    if (fuzzy) return { district: fuzzy, tier: "aynı plaka, yazım benzerliği" };
  }

  const nationwideExact = districtsByNameNationwide.get(aliased) ?? [];
  if (nationwideExact.length === 1) {
    return { district: nationwideExact[0]!, tier: "ülke genelinde tekil isim eşleşmesi" };
  }

  const strippedNationwide = stripMerkezSuffix(aliased) ?? aliased;
  const matchingProvince = provinceByNormalizedName.get(strippedNationwide);
  if (matchingProvince) {
    const plateCode = String(matchingProvince.plateCode).padStart(2, "0");
    const merkez = districtsByProvincePlate.get(plateCode)?.get("merkez");
    if (merkez) return { district: merkez, tier: "ülke genelinde il merkezi eşleşmesi" };
  }

  if (nationwideExact.length > 1) {
    const [lon, lat] = computeCentroid(boundary.geometry);
    const containing = nationwideExact.filter((candidate) => {
      const geometry = provinceGeometryById.get(candidate.provinceId);
      return geometry ? isPointInGeometry([lon, lat], geometry) : false;
    });
    if (containing.length === 1) {
      return {
        district: containing[0]!,
        tier: "aynı isimde birden fazla ilçe, coğrafi konumla ayrıştırıldı",
      };
    }
  }

  return undefined;
}

export function matchDistrictBoundaries(
  districts: MatchableDistrict[],
  provinces: MatchableProvince[],
  districtBoundaries: DistrictBoundary[],
  provinceGeometryById: Map<string, PolygonalGeometry>,
): DistrictBoundaryMatchResult {
  const provinceById = new Map(provinces.map((p) => [p.id, p]));
  const provinceByPlate = new Map<string, MatchableProvince>();
  const provinceByNormalizedName = new Map<string, MatchableProvince>();
  for (const province of provinces) {
    provinceByPlate.set(String(province.plateCode).padStart(2, "0"), province);
    provinceByNormalizedName.set(normalizeName(province.name), province);
  }

  const districtsByProvincePlate = new Map<string, Map<string, MatchableDistrict>>();
  const districtsByNameNationwide = new Map<string, MatchableDistrict[]>();
  for (const district of districts) {
    const province = provinceById.get(district.provinceId);
    const plateCode = province ? String(province.plateCode).padStart(2, "0") : undefined;
    const normalized = normalizeName(district.name);
    if (plateCode) {
      const byName =
        districtsByProvincePlate.get(plateCode) ?? new Map<string, MatchableDistrict>();
      byName.set(normalized, district);
      districtsByProvincePlate.set(plateCode, byName);
    }
    const nationwide = districtsByNameNationwide.get(normalized) ?? [];
    nationwide.push(district);
    districtsByNameNationwide.set(normalized, nationwide);
  }

  const geometryByDistrictId = new Map<string, PolygonalGeometry>();
  const tierByDistrictId = new Map<string, string>();
  const unmatchedBoundaries: DistrictBoundary[] = [];

  for (const boundary of districtBoundaries) {
    const match = resolveMatch(
      boundary,
      districtsByProvincePlate,
      districtsByNameNationwide,
      provinceByPlate,
      provinceByNormalizedName,
      provinceGeometryById,
    );
    if (!match) {
      unmatchedBoundaries.push(boundary);
      continue;
    }
    geometryByDistrictId.set(match.district.id, boundary.geometry);
    tierByDistrictId.set(match.district.id, match.tier);
  }

  return { geometryByDistrictId, tierByDistrictId, unmatchedBoundaries };
}
