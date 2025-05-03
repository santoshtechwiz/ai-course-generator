/**
 * Formats quiz time in seconds to a human-readable string
 */
export function formatQuizTime(seconds: number): string {
  if (!seconds || seconds < 0) {
    return "0s"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  const parts = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`)
  }

  return parts.join(" ")
}

/**
 * Calculates the performance level based on score
 */
export function calculatePerformanceLevel(score: number): string {
  if (score >= 90) {
    return "Excellent"
  } else if (score >= 75) {
    return "Good"
  } else if (score >= 60) {
    return "Satisfactory"
  } else if (score >= 40) {
    return "Needs Improvement"
  } else {
    return "Poor"
  }
}

/**
 * Gets the color for a difficulty level
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-600"
    case "medium":
      return "text-amber-600"
    case "hard":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

/**
 * Checks if an answer was submitted too quickly (potential cheating)
 */
export function isTooFastAnswer(startTime: number, minTimeSeconds = 2): boolean {
  const elapsedTime = (Date.now() - startTime) / 1000
  return elapsedTime < minTimeSeconds
}

/**
 * Calculates the average time per question
 */
export function calculateAverageTimePerQuestion(totalTime: number, questionCount: number): number {
  if (!totalTime || !questionCount || questionCount <= 0) {
    return 0
  }

  return Math.round(totalTime / questionCount)
}

/**
 * Calculates the time efficiency score (higher is better)
 */
export function calculateTimeEfficiencyScore(totalTime: number, questionCount: number, correctCount: number): number {
  if (!totalTime || !questionCount || questionCount <= 0 || !correctCount || correctCount <= 0) {
    return 0
  }

  const avgTimePerQuestion = totalTime / questionCount
  const correctRatio = correctCount / questionCount

  // Lower time and higher correct ratio gives higher score
  // Scale from 0-100
  return Math.min(100, Math.round((correctRatio * 100) / (avgTimePerQuestion / 10)))
}
