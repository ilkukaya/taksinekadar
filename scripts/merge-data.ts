/**
 * Phase 2 pipeline: merge taxi-stand candidates from multiple sources into one record per
 * real-world stand. Field-level authority follows spec §12.3 — it is NOT "highest-priority
 * source wins the whole record": each field is taken from its preferred source and only
 * falls back to another source when the preferred one didn't report that field.
 *
 * This module is fully implemented and unit-testable today; it just has no real multi-source
 * input yet (import-osm.ts / import-municipal-data.ts are still Phase 2 TODOs). Wire it up by
 * calling `mergeCandidates()` with the combined output of those two scripts.
 */
import { haversineDistanceMeters } from "../src/lib/geography/distance";
import { similarityRatio } from "../src/lib/utils/similarity";
import type { TaxiStandSourceType } from "../src/lib/validation/enums";

export type MergeCandidate = {
  sourceRecordId: string;
  sourceType: TaxiStandSourceType;
  provinceId: string;
  districtId?: string;
  name?: string;
  address?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
};

export type MergedStand = {
  sourceRecordIds: string[];
  provinceId: string;
  districtId?: string;
  name?: string;
  address?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
};

const NAME_OR_ADDRESS_AUTHORITY: TaxiStandSourceType[] = [
  "municipality",
  "chamber",
  "open-data",
  "official-website",
  "osm",
];
const COORDINATE_AUTHORITY: TaxiStandSourceType[] = [
  "osm",
  "municipality",
  "chamber",
  "open-data",
  "official-website",
];
const HOURS_AND_SECONDARY_PHONE_AUTHORITY: TaxiStandSourceType[] = [
  "official-website",
  "municipality",
  "chamber",
  "open-data",
  "osm",
];

const NEARBY_METERS = 55;
const NAME_SIMILARITY_THRESHOLD = 0.85;

function isSameStand(a: MergeCandidate, b: MergeCandidate): boolean {
  if (a.provinceId !== b.provinceId) return false;

  if (a.phonePrimary && b.phonePrimary && a.phonePrimary === b.phonePrimary) return true;

  if (
    a.latitude !== undefined &&
    a.longitude !== undefined &&
    b.latitude !== undefined &&
    b.longitude !== undefined
  ) {
    const distance = haversineDistanceMeters(
      { latitude: a.latitude, longitude: a.longitude },
      { latitude: b.latitude, longitude: b.longitude },
    );
    if (
      distance <= NEARBY_METERS &&
      a.name &&
      b.name &&
      similarityRatio(a.name, b.name) >= NAME_SIMILARITY_THRESHOLD
    ) {
      return true;
    }
  }

  return false;
}

function clusterCandidates(candidates: MergeCandidate[]): MergeCandidate[][] {
  const clusters: MergeCandidate[][] = [];

  for (const candidate of candidates) {
    const existingCluster = clusters.find((cluster) =>
      cluster.some((member) => isSameStand(member, candidate)),
    );
    if (existingCluster) existingCluster.push(candidate);
    else clusters.push([candidate]);
  }

  return clusters;
}

function pickByAuthority<K extends keyof MergeCandidate>(
  cluster: MergeCandidate[],
  field: K,
  authorityOrder: TaxiStandSourceType[],
): MergeCandidate[K] | undefined {
  for (const sourceType of authorityOrder) {
    const match = cluster.find((c) => c.sourceType === sourceType && c[field] !== undefined);
    if (match) return match[field];
  }
  return undefined;
}

function mergeCluster(cluster: MergeCandidate[]): MergedStand {
  return {
    sourceRecordIds: cluster.map((c) => c.sourceRecordId),
    provinceId: cluster[0]!.provinceId,
    districtId: cluster.find((c) => c.districtId)?.districtId,
    name: pickByAuthority(cluster, "name", NAME_OR_ADDRESS_AUTHORITY),
    address: pickByAuthority(cluster, "address", NAME_OR_ADDRESS_AUTHORITY),
    phonePrimary: pickByAuthority(cluster, "phonePrimary", NAME_OR_ADDRESS_AUTHORITY),
    latitude: pickByAuthority(cluster, "latitude", COORDINATE_AUTHORITY),
    longitude: pickByAuthority(cluster, "longitude", COORDINATE_AUTHORITY),
    openingHours: pickByAuthority(cluster, "openingHours", HOURS_AND_SECONDARY_PHONE_AUTHORITY),
    phoneSecondary: pickByAuthority(cluster, "phoneSecondary", HOURS_AND_SECONDARY_PHONE_AUTHORITY),
  };
}

export function mergeCandidates(candidates: MergeCandidate[]): MergedStand[] {
  return clusterCandidates(candidates).map(mergeCluster);
}

function main() {
  console.log(
    "merge-data.ts, import-osm.ts ve import-municipal-data.ts'in ürettiği aday kayıtları " +
      "birleştirmek için tasarlanmıştır. Bu adaylar henüz üretilmediğinden (Faz 2), şu an " +
      "birleştirilecek veri yok.",
  );
}

main();
