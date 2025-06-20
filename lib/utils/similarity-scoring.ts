import { getBestSimilarityScore, levenshteinDistance } from "./text-similarity"

/**
 * Calculates similarity score and determines if an answer is correct based on thresholds
 * @param userAnswer The user's answer
 * @param correctAnswer The correct answer
 * @returns Object with similarity score and correctness indicators
 */
export function calculateAnswerSimilarity(userAnswer: string, correctAnswer: string) {
  // Convert similarity to 0-1 scale
  const similarity = getBestSimilarityScore(userAnswer || "", correctAnswer || "") / 100

  // Determine correctness based on thresholds:
  // - 90%+ similarity: Fully correct (1 point)
  // - 70-90% similarity: Partially correct (0.5 points)
  // - Below 70%: Incorrect (0 points)
  const isFullyCorrect = similarity >= 0.9
  const isPartiallyCorrect = similarity >= 0.7 && similarity < 0.9
  const isIncorrect = similarity < 0.7

  // Calculate points (1.0 for fully correct, 0.5 for partially correct)
  const points = isFullyCorrect ? 1 : isPartiallyCorrect ? 0.5 : 0

  // Get appropriate feedback label
  let similarityLabel = ""
  if (isFullyCorrect) similarityLabel = "Correct"
  else if (isPartiallyCorrect) similarityLabel = "Almost Correct"
  else if (similarity >= 0.5) similarityLabel = "Close"
  else similarityLabel = "Incorrect"

  return {
    similarity,
    similarityLabel,
    isFullyCorrect,
    isPartiallyCorrect, 
    isIncorrect,
    isCorrect: similarity >= 0.7, // Legacy boolean for backward compatibility
    points,
  }
}

/**
 * Get similarity feedback message based on similarity score
 * @param similarity Similarity score (0-1)
 * @returns Feedback message
 */
export function getSimilarityFeedback(similarity: number): string {
  if (similarity >= 0.9) return "Your answer matches perfectly!"
  if (similarity >= 0.85) return "Your answer is very close to correct!"
  if (similarity >= 0.8) return "Your answer is close enough to be correct!"
  if (similarity >= 0.7) return "Your answer has the right idea but could be more precise."
  if (similarity >= 0.6) return "Your answer contains some correct elements."
  if (similarity >= 0.5) return "Your answer is getting close but needs improvement."
  if (similarity >= 0.4) return "Your answer shows some understanding of the concept."
  if (similarity >= 0.3) return "Your answer is partially on track but needs work."
  return "Your answer needs significant improvement."
}

/**
 * Recalculate quiz score with partial credit for "almost correct" answers
 * @param questionResults Array of question results with similarity scores
 * @returns Updated score information
 */
export function calculateQuizScoreWithPartialCredit(questionResults: Array<any>) {
  let totalPoints = 0
  let maxPossiblePoints = questionResults.length

  questionResults.forEach(result => {
    // For each question, add points based on similarity
    const similarity = result.similarity || 0
    
    if (similarity >= 0.9) {
      // Full credit (100%)
      totalPoints += 1.0
    } else if (similarity >= 0.7) {
      // Partial credit (50%)
      totalPoints += 0.5
    }
    // Otherwise no points (0%)
  })

  const percentage = Math.round((totalPoints / maxPossiblePoints) * 100)
  
  return {
    score: percentage,
    totalPoints,
    maxPossiblePoints,
    percentage
  }
}
