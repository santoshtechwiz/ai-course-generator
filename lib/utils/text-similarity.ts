/**
 * Calculates the Levenshtein distance between two strings
 * This is a measure of the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 */
export function levenshteinDistance(a: string, b: string): number {
  // Handle edge cases
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Create a matrix of size (a.length + 1) x (b.length + 1)
  const matrix: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null))

  // Fill the first row and column with their indices
  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  // Fill the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
    }
  }

  // Return the bottom-right cell of the matrix
  return matrix[a.length][b.length]
}

/**
 * Calculates the Jaro-Winkler similarity between two strings
 * This algorithm gives more favorable ratings to strings that match from the beginning.
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  // Handle edge cases
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  // Calculate the match distance
  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1

  // Initialize match arrays
  const s1Matches = new Array(s1.length).fill(false)
  const s2Matches = new Array(s2.length).fill(false)

  // Count matching characters
  let matches = 0
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, s2.length)

    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true
        s2Matches[j] = true
        matches++
        break
      }
    }
  }

  // If no matches, return 0
  if (matches === 0) {
    return 0
  }

  // Count transpositions
  let transpositions = 0
  let k = 0
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) {
        k++
      }
      if (s1[i] !== s2[k]) {
        transpositions++
      }
      k++
    }
  }

  // Calculate Jaro similarity
  const jaroSimilarity = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3

  // Calculate common prefix length (up to 4 characters)
  let commonPrefix = 0
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length))
  while (commonPrefix < maxPrefix && s1[commonPrefix] === s2[commonPrefix]) {
    commonPrefix++
  }

  // Calculate Jaro-Winkler similarity
  // The scaling factor p is set to 0.1 by convention
  const p = 0.1
  return jaroSimilarity + commonPrefix * p * (1 - jaroSimilarity)
}

/**
 * Calculates the similarity percentage between two strings using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings for comparison
  const a = String(str1 || "")
    .toLowerCase()
    .trim()
  const b = String(str2 || "")
    .toLowerCase()
    .trim()

  // If either string is empty, return 0
  if (a.length === 0 || b.length === 0) {
    return 0
  }

  // If the strings are identical, return 100
  if (a === b) {
    return 100
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(a, b)
  const maxLength = Math.max(a.length, b.length)

  // Calculate similarity percentage
  return Math.round(((maxLength - distance) / maxLength) * 100)
}

/**
 * Gets the best similarity score between two strings using multiple algorithms
 */
export function getBestSimilarityScore(userAnswer: string, correctAnswer: string): number {
  // Normalize strings
  const normalizedUserAnswer = String(userAnswer || "")
    .toLowerCase()
    .trim()
  const normalizedCorrectAnswer = String(correctAnswer || "")
    .toLowerCase()
    .trim()

  // If either string is empty, return 0
  if (!normalizedUserAnswer || !normalizedCorrectAnswer) {
    return 0
  }

  // If the strings are identical, return 100
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return 100
  }

  // For very short answers, Levenshtein works well
  if (normalizedUserAnswer.length < 5 || normalizedCorrectAnswer.length < 5) {
    return calculateSimilarity(normalizedUserAnswer, normalizedCorrectAnswer)
  }

  // For longer answers, compare both algorithms and use the higher score
  const levenshteinScore = calculateSimilarity(normalizedUserAnswer, normalizedCorrectAnswer)
  const jaroWinklerScore = Math.round(jaroWinklerSimilarity(normalizedUserAnswer, normalizedCorrectAnswer) * 100)

  return Math.max(levenshteinScore, jaroWinklerScore)
}

/**
 * Gets a qualitative assessment of similarity
 */
export function getSimilarityLevel(similarity: number): "high" | "moderate" | "low" {
  if (similarity >= 80) return "high"
  if (similarity >= 50) return "moderate"
  return "low"
}
