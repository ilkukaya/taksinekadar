import { writeFileSync, mkdirSync } from "node:fs";
import { getAllTaxiStands } from "../src/lib/repositories/taxi-stands";
import { haversineDistanceMeters } from "../src/lib/geography/distance";
import { similarityRatio } from "../src/lib/utils/similarity";
import { reportsPath, PROJECT_ROOT } from "../src/lib/utils/paths";
import { join } from "node:path";
import type { TaxiStand } from "../src/lib/validation/schemas";

/** Scoring per spec §14.4 — 80+ goes to the human review list, never auto-published. */
const SCORE_SAME_SOURCE_ID = 100;
const SCORE_SAME_PHONE = 60;
const SCORE_NEARBY_COORDINATES = 25;
const SCORE_NAME_SIMILARITY = 15;
const SCORE_ADDRESS_SIMILARITY = 10;
const NEARBY_METERS = 55;
const NAME_SIMILARITY_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 80;

type CandidatePair = {
  a: TaxiStand;
  b: TaxiStand;
  score: number;
  reasons: string[];
};

function scorePair(a: TaxiStand, b: TaxiStand): CandidatePair {
  let score = 0;
  const reasons: string[] = [];

  if (a.sourceRecordId && b.sourceRecordId && a.sourceRecordId === b.sourceRecordId) {
    score += SCORE_SAME_SOURCE_ID;
    reasons.push("aynı kaynak kimliği");
  }

  if (a.phonePrimary && b.phonePrimary && a.phonePrimary === b.phonePrimary) {
    score += SCORE_SAME_PHONE;
    reasons.push("aynı telefon");
  }

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
    if (distance <= NEARBY_METERS) {
      score += SCORE_NEARBY_COORDINATES;
      reasons.push(`${Math.round(distance)}m mesafede koordinat`);
    }
  }

  const nameSimilarity = similarityRatio(a.name, b.name);
  if (nameSimilarity >= NAME_SIMILARITY_THRESHOLD) {
    score += SCORE_NAME_SIMILARITY;
    reasons.push(`isim benzerliği %${Math.round(nameSimilarity * 100)}`);
  }

  if (
    a.address &&
    b.address &&
    similarityRatio(a.address, b.address) >= NAME_SIMILARITY_THRESHOLD
  ) {
    score += SCORE_ADDRESS_SIMILARITY;
    reasons.push("adres benzerliği");
  }

  return { a, b, score, reasons };
}

function findCandidatePairs(stands: TaxiStand[]): CandidatePair[] {
  const pairs: CandidatePair[] = [];

  // Only compare stands within the same district — cross-district false positives on
  // generic names ("Merkez Taksi Durağı") aren't worth the O(n²) cost at national scale.
  const byDistrict = new Map<string, TaxiStand[]>();
  for (const stand of stands) {
    const bucket = byDistrict.get(stand.districtId) ?? [];
    bucket.push(stand);
    byDistrict.set(stand.districtId, bucket);
  }

  for (const bucket of byDistrict.values()) {
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const pair = scorePair(bucket[i]!, bucket[j]!);
        if (pair.score > 0) pairs.push(pair);
      }
    }
  }

  return pairs.sort((a, b) => b.score - a.score);
}

function main() {
  const stands = getAllTaxiStands();
  const pairs = findCandidatePairs(stands);
  const needsReview = pairs.filter((p) => p.score >= REVIEW_THRESHOLD);

  mkdirSync(join(PROJECT_ROOT, "data/reports"), { recursive: true });

  const report = {
    generatedAt: new Date().toISOString().slice(0, 10),
    totalStands: stands.length,
    candidatePairCount: pairs.length,
    reviewThreshold: REVIEW_THRESHOLD,
    needsReviewCount: needsReview.length,
    pairs: pairs.map((p) => ({
      standAId: p.a.id,
      standAName: p.a.name,
      standBId: p.b.id,
      standBName: p.b.name,
      score: p.score,
      reasons: p.reasons,
      needsReview: p.score >= REVIEW_THRESHOLD,
    })),
  };

  writeFileSync(reportsPath("duplicates.json"), JSON.stringify(report, null, 2), "utf-8");

  console.log(
    `Mükerrerlik taraması: ${stands.length} durak, ${pairs.length} aday çift, ${needsReview.length} kayıt inceleme gerektiriyor (eşik: ${REVIEW_THRESHOLD}).`,
  );
}

main();
