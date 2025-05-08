/**
 * Text similarity utility functions using edit distance algorithms
 */

/**
 * Calculates the Levenshtein distance between two strings
 * This is a measure of the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
    // Create a matrix of size (str1.length + 1) x (str2.length + 1)
    const matrix: number[][] = Array(str1.length + 1)
      .fill(null)
      .map(() => Array(str2.length + 1).fill(null))
  
    // Initialize the first row and column
    for (let i = 0; i <= str1.length; i++) {
      matrix[i][0] = i
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j
    }
  
    // Fill the matrix
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        )
      }
    }
  
    // Return the bottom-right cell which contains the distance
    return matrix[str1.length][str2.length]
  }
  
  /**
   * Calculates the similarity percentage between two strings using Levenshtein distance
   * Returns a value between 0 (completely different) and 100 (identical)
   */
  export function calculateSimilarityPercentage(str1: string, str2: string): number {
    if (!str1 && !str2) return 100 // Both empty strings are identical
    if (!str1 || !str2) return 0 // One empty string means no similarity
  
    // Normalize strings for comparison
    const normalizedStr1 = str1.toLowerCase().trim()
    const normalizedStr2 = str2.toLowerCase().trim()
  
    if (normalizedStr1 === normalizedStr2) return 100 // Identical strings
  
    const distance = levenshteinDistance(normalizedStr1, normalizedStr2)
    const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length)
  
    // Calculate similarity as a percentage
    return Math.round(((maxLength - distance) / maxLength) * 100)
  }
  
  /**
   * Calculates the Jaro-Winkler similarity between two strings
   * This algorithm gives more favorable ratings to strings that match from the beginning
   * Returns a value between 0 (completely different) and 100 (identical)
   */
  export function jaroWinklerSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 100 // Both empty strings are identical
    if (!str1 || !str2) return 0 // One empty string means no similarity
  
    // Normalize strings for comparison
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
  
    if (s1 === s2) return 100 // Identical strings
  
    // Calculate Jaro similarity
    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  
    // Find matching characters within the match distance
    const s1Matches: boolean[] = Array(s1.length).fill(false)
    const s2Matches: boolean[] = Array(s2.length).fill(false)
  
    let matchingCharacters = 0
  
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance)
      const end = Math.min(i + matchDistance + 1, s2.length)
  
      for (let j = start; j < end; j++) {
        if (!s2Matches[j] && s1[i] === s2[j]) {
          s1Matches[i] = true
          s2Matches[j] = true
          matchingCharacters++
          break
        }
      }
    }
  
    if (matchingCharacters === 0) return 0
  
    // Count transpositions
    let transpositions = 0
    let k = 0
  
    for (let i = 0; i < s1.length; i++) {
      if (s1Matches[i]) {
        while (!s2Matches[k]) k++
  
        if (s1[i] !== s2[k]) transpositions++
        k++
      }
    }
  
    // Calculate Jaro similarity
    const jaroSimilarity =
      (matchingCharacters / s1.length +
        matchingCharacters / s2.length +
        (matchingCharacters - transpositions / 2) / matchingCharacters) /
      3
  
    // Calculate Jaro-Winkler similarity
    const prefixLength = Math.min(4, Math.min(s1.length, s2.length))
    let commonPrefix = 0
  
    for (let i = 0; i < prefixLength; i++) {
      if (s1[i] === s2[i]) commonPrefix++
      else break
    }
  
    const jaroWinkler = jaroSimilarity + commonPrefix * 0.1 * (1 - jaroSimilarity)
  
    // Convert to percentage
    return Math.round(jaroWinkler * 100)
  }
  
  /**
   * Determines the best similarity algorithm to use based on the strings
   * and returns the similarity percentage
   */
  export function getBestSimilarityScore(userAnswer: string, correctAnswer: string): number {
    if (!userAnswer && !correctAnswer) return 100
    if (!userAnswer || !correctAnswer) return 0
  
    // Normalize strings
    const normalizedUser = userAnswer.toLowerCase().trim()
    const normalizedCorrect = correctAnswer.toLowerCase().trim()
  
    if (normalizedUser === normalizedCorrect) return 100
  
    // For short answers, Levenshtein works well
    if (normalizedUser.length < 10 && normalizedCorrect.length < 10) {
      return calculateSimilarityPercentage(normalizedUser, normalizedCorrect)
    }
  
    // For longer answers, use both algorithms and take the higher score
    const levenshteinScore = calculateSimilarityPercentage(normalizedUser, normalizedCorrect)
    const jaroWinklerScore = jaroWinklerSimilarity(normalizedUser, normalizedCorrect)
  
    return Math.max(levenshteinScore, jaroWinklerScore)
  }
  
  /**
   * Returns a qualitative assessment of the similarity score
   */
  export function getSimilarityCategory(score: number): {
    category: "exact" | "high" | "moderate" | "low" | "different"
    color: string
  } {
    if (score === 100) {
      return { category: "exact", color: "text-green-600" }
    } else if (score >= 85) {
      return { category: "high", color: "text-green-500" }
    } else if (score >= 70) {
      return { category: "moderate", color: "text-yellow-500" }
    } else if (score >= 50) {
      return { category: "low", color: "text-orange-500" }
    } else {
      return { category: "different", color: "text-red-500" }
    }
  }
  