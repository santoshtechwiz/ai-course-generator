/**
 * Utility functions for validating quiz inputs and detecting potential issues
 */

/**
 * Checks if user input might be garbage or unrelated to the question
 * @param input - User input to check
 * @param contextWords - Array of words from the question context
 * @param threshold - Similarity threshold (0-1, higher means stricter)
 * @returns Whether the input appears to be garbage
 */
export function isGarbageInput(input: string, contextWords: string[], threshold = 0.75): boolean {
  if (!input || input.length < 3) return false

  const inputLower = input.toLowerCase()

  // Filter context words to only include meaningful ones
  const relevantWords = contextWords.filter((word) => word.length > 3)

  if (relevantWords.length === 0) return false

  // Find the minimum normalized Levenshtein distance to any context word
  const minDistance = relevantWords.reduce((min, word) => {
    const distance = levenshteinDistance(inputLower, word.toLowerCase())
    const normalizedDistance = distance / Math.max(inputLower.length, word.length)
    return Math.min(min, normalizedDistance)
  }, 1)

  return minDistance > threshold
}

/**
 * Checks if the user is answering too quickly (potential cheating or random guessing)
 * @param timeSpent - Time spent on the question in seconds
 * @param minimumTime - Minimum expected time in seconds
 * @returns Whether the answer was submitted too quickly
 */
export function isTooFastAnswer(timeSpent: number, minimumTime = 2): boolean {
  return timeSpent < minimumTime
}

/**
 * Validates that a quiz has sufficient data to be displayed
 * @param quiz - Quiz data object
 * @returns Object with isValid flag and any error messages
 */
export function validateQuizData(quiz: any): { isValid: boolean; error?: string } {
  if (!quiz) {
    return { isValid: false, error: "Quiz data is missing" }
  }

  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return { isValid: false, error: "No questions available for this quiz" }
  }

  return { isValid: true }
}

/**
 * Levenshtein distance calculation function
 * @param a - First string
 * @param b - Second string
 * @returns Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1]
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}
