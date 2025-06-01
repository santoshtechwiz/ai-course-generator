/**
 * Normalize text by trimming, lowercasing, and removing punctuation.
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "") // remove punctuation
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
}

/**
 * Levenshtein distance algorithm.
 * Returns the number of edits needed to convert a to b.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // deletion
            dp[i][j - 1], // insertion
            dp[i - 1][j - 1], // substitution
          )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate normalized similarity score between 0 and 1.
 * A score closer to 1 means more similar.
 */
export function similarityScore(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (!normA && !normB) return 1
  if (!normA || !normB) return 0

  const distance = levenshteinDistance(normA, normB)
  const maxLen = Math.max(normA.length, normB.length)

  return 1 - distance / maxLen
}

/**
 * Helper to get similarity result with metadata.
 */
export function getTextSimilarity(userAnswer: string, correctAnswer: string) {
  const similarity = similarityScore(userAnswer, correctAnswer)

  return {
    userAnswer,
    correctAnswer,
    similarity: Number.parseFloat(similarity.toFixed(4)), // limit float precision
    isMatch: similarity >= 0.8, // configurable threshold
  }
}

/**
 * Calculate Jaccard similarity between two strings.
 * Measures similarity based on word overlap.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (!normA && !normB) return 1
  if (!normA || !normB) return 0

  const wordsA = new Set(normA.split(" "))
  const wordsB = new Set(normB.split(" "))

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])

  return intersection.size / union.size
}

/**
 * Calculate cosine similarity between two strings based on word frequency.
 */
export function cosineSimilarity(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (!normA && !normB) return 1
  if (!normA || !normB) return 0

  // Get word frequencies
  const getWordFreq = (text: string) => {
    const words = text.split(" ")
    const freq: Record<string, number> = {}
    for (const word of words) {
      if (word) freq[word] = (freq[word] || 0) + 1
    }
    return freq
  }

  const freqA = getWordFreq(normA)
  const freqB = getWordFreq(normB)

  // Get all unique words
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)])

  // Calculate dot product
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (const word of allWords) {
    const countA = freqA[word] || 0
    const countB = freqB[word] || 0

    dotProduct += countA * countB
    magnitudeA += countA * countA
    magnitudeB += countB * countB
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) return 0

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Get the best similarity score using multiple algorithms.
 * Returns a percentage (0-100).
 */
export function getBestSimilarityScore(userAnswer: string, correctAnswer: string): number {
  if (!userAnswer || !correctAnswer) return 0

  // Calculate similarity using different methods
  const levenshtein = similarityScore(userAnswer, correctAnswer)
  const jaccard = jaccardSimilarity(userAnswer, correctAnswer)
  const cosine = cosineSimilarity(userAnswer, correctAnswer)

  // Use the highest score (most favorable to the user)
  const bestScore = Math.max(levenshtein, jaccard, cosine)

  // Convert to percentage
  return Math.round(bestScore * 100)
}

/**
 * Get detailed similarity analysis using multiple algorithms.
 */
export function getDetailedSimilarityAnalysis(userAnswer: string, correctAnswer: string) {
  const levenshtein = similarityScore(userAnswer, correctAnswer)
  const jaccard = jaccardSimilarity(userAnswer, correctAnswer)
  const cosine = cosineSimilarity(userAnswer, correctAnswer)
  const bestScore = Math.max(levenshtein, jaccard, cosine)

  return {
    userAnswer,
    correctAnswer,
    scores: {
      levenshtein: Math.round(levenshtein * 100),
      jaccard: Math.round(jaccard * 100),
      cosine: Math.round(cosine * 100),
    },
    bestScore: Math.round(bestScore * 100),
    isMatch: bestScore >= 0.8,
  }
}

/**
 * Determines if a user answer is close enough to the correct answer
 * to be considered acceptable
 *
 * @param userInput The user's provided answer
 * @param correctAnswer The expected correct answer
 * @param threshold Similarity threshold percentage (default: 80)
 * @returns boolean indicating if the answer is close enough
 */
export function isAnswerCloseEnough(
  userInput: string,
  correctAnswer: string,
  threshold: number = 80,
): boolean {
  if (!userInput || !correctAnswer) return false

  // Get similarity score (as percentage 0-100)
  const similarityScore = getBestSimilarityScore(userInput, correctAnswer)

  // Return true if the similarity meets or exceeds the threshold
  return similarityScore >= threshold
}

/**
 * Generates a hint for a correct answer
 *
 * @param correctAnswer The correct answer to create a hint for
 * @param hintLevel The hint level (0-2), with higher levels revealing more
 * @returns A string containing a hint
 */
export function getHint(correctAnswer: string, hintLevel: number = 0): string {
  if (!correctAnswer || correctAnswer.length === 0) {
    return "No hint available"
  }

  // Normalize the answer for hint generation
  const answer = normalizeText(correctAnswer)

  switch (hintLevel) {
    case 0:
      // Level 0: First letter hint
      return `Starts with: '${answer[0].toUpperCase()}'`

    case 1:
      // Level 1: Masked word with some letters revealed
      return generateMaskedWord(answer)

    case 2:
      // Level 2: First and last letters + length
      return `${answer[0].toUpperCase()}${"_".repeat(Math.max(0, answer.length - 2))}${answer[answer.length - 1]}`

    default:
      return `Hint: ${answer.length} letters`
  }
}

/**
 * Helper function to generate a masked word with some strategic letter reveals
 *
 * @param word The word to mask
 * @returns A masked version of the word with some letters revealed
 */
function generateMaskedWord(word: string): string {
  if (word.length <= 2) {
    return `${word[0]} _ `
  }

  const maskedChars = word.split("").map((char, index) => {
    // Always reveal the first letter
    if (index === 0) return char.toUpperCase()

    // For longer words, reveal vowels or every third character
    if (word.length > 4) {
      if ("aeiou".includes(char.toLowerCase()) || index % 3 === 0) {
        return char
      }
    }
    // For shorter words, just reveal first letter and a middle letter
    else if (index === Math.floor(word.length / 2)) {
      return char
    }

    return "_"
  })

  // Join with spaces for better readability
  return maskedChars.join(" ")
}
