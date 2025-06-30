/**
 * Text similarity calculation utilities for quiz answers
 */

export interface SimilarityResult {
  similarity: number
  isAcceptable: boolean
  confidence: number
}

export function calculateAnswerSimilarity(
  userAnswer: string,
  correctAnswer: string,
  threshold = 0.7,
): SimilarityResult {
  if (!userAnswer.trim() || !correctAnswer.trim()) {
    return { similarity: 0, isAcceptable: false, confidence: 0 }
  }

  const normalizedUser = normalizeText(userAnswer)
  const normalizedCorrect = normalizeText(correctAnswer)

  // Calculate multiple similarity metrics
  const exactMatch = normalizedUser === normalizedCorrect ? 1 : 0
  const levenshteinSim = calculateLevenshteinSimilarity(normalizedUser, normalizedCorrect)
  const jaccardSim = calculateJaccardSimilarity(normalizedUser, normalizedCorrect)
  const semanticSim = calculateSemanticSimilarity(normalizedUser, normalizedCorrect)

  // Weighted combination of similarity metrics
  const similarity = exactMatch > 0 ? 1 : levenshteinSim * 0.4 + jaccardSim * 0.3 + semanticSim * 0.3

  const isAcceptable = similarity >= threshold
  const confidence = Math.min(similarity * 1.2, 1) // Boost confidence slightly

  return { similarity, isAcceptable, confidence }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
}

function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLength
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(" ").filter((word) => word.length > 0))
  const set2 = new Set(str2.split(" ").filter((word) => word.length > 0))

  const intersection = new Set([...set1].filter((x) => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return union.size === 0 ? 0 : intersection.size / union.size
}

function calculateSemanticSimilarity(str1: string, str2: string): number {
  // Simple semantic similarity based on common words and synonyms
  const words1 = str1.split(" ").filter((word) => word.length > 2)
  const words2 = str2.split(" ").filter((word) => word.length > 2)

  if (words1.length === 0 || words2.length === 0) return 0

  let matches = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || areSynonyms(word1, word2)) {
        matches++
        break
      }
    }
  }

  return matches / Math.max(words1.length, words2.length)
}

function areSynonyms(word1: string, word2: string): boolean {
  // Simple synonym checking - can be expanded with a proper thesaurus
  const synonymGroups = [
    ["function", "method", "procedure"],
    ["variable", "var", "identifier"],
    ["array", "list", "collection"],
    ["object", "instance", "entity"],
    ["class", "type", "category"],
    ["loop", "iteration", "cycle"],
    ["condition", "check", "test"],
    ["return", "output", "result"],
    ["parameter", "argument", "input"],
    ["property", "attribute", "field"],
  ]

  return synonymGroups.some((group) => group.includes(word1) && group.includes(word2))
}

export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.95) return "Perfect Match"
  if (similarity >= 0.85) return "Excellent"
  if (similarity >= 0.75) return "Very Good"
  if (similarity >= 0.65) return "Good"
  if (similarity >= 0.5) return "Fair"
  if (similarity >= 0.3) return "Partial"
  return "Needs Improvement"
}

export function getSimilarityFeedback(similarity: number): string {
  if (similarity >= 0.95) {
    return "Outstanding! Your answer demonstrates complete understanding of the concept."
  }
  if (similarity >= 0.85) {
    return "Excellent work! Your answer shows strong comprehension with minor gaps."
  }
  if (similarity >= 0.75) {
    return "Very good! Your answer covers the main points effectively."
  }
  if (similarity >= 0.65) {
    return "Good effort! Your answer addresses key aspects but could be more comprehensive."
  }
  if (similarity >= 0.5) {
    return "Fair attempt. Your answer touches on relevant points but needs more detail."
  }
  if (similarity >= 0.3) {
    return "Partial understanding shown. Consider reviewing the key concepts and try again."
  }
  return "Your answer needs significant improvement. Review the material and consider using hints."
}
