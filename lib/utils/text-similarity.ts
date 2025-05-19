// @/lib/utils/text-similarity.ts

/**
 * Normalize text by trimming, lowercasing, and removing punctuation.
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '') // remove punctuation
    .replace(/\s+/g, ' ')      // collapse whitespace
    .trim();
}

/**
 * Levenshtein distance algorithm.
 * Returns the number of edits needed to convert a to b.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // deletion
          dp[i][j - 1],    // insertion
          dp[i - 1][j - 1] // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate normalized similarity score between 0 and 1.
 * A score closer to 1 means more similar.
 */
export function similarityScore(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);

  if (!normA && !normB) return 1;
  if (!normA || !normB) return 0;

  const distance = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);

  return 1 - distance / maxLen;
}

/**
 * Helper to get similarity result with metadata.
 */
export function getTextSimilarity(userAnswer: string, correctAnswer: string) {
  const similarity = similarityScore(userAnswer, correctAnswer);

  return {
    userAnswer,
    correctAnswer,
    similarity: parseFloat(similarity.toFixed(4)), // limit float precision
    isMatch: similarity >= 0.8 // configurable threshold
  };
}
