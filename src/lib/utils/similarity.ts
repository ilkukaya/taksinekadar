function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i]![0] = i;
  for (let j = 0; j < cols; j++) matrix[0]![j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[rows - 1]![cols - 1]!;
}

function normalizeForComparison(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein-based similarity ratio in [0, 1] — 1 means identical after normalization. */
export function similarityRatio(a: string, b: string): number {
  const normA = normalizeForComparison(a);
  const normB = normalizeForComparison(b);
  const maxLength = Math.max(normA.length, normB.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLength;
}
