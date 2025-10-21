/**
 * Ordering Quiz Scoring and Results Service
 * Handles score calculation, accuracy metrics, grading, and analytics
 */

interface OrderingQuizScore {
  isCorrect: boolean
  score: number // 0-100
  accuracy: number // Percentage of correct positions
  grade: "A" | "B" | "C" | "D" | "F"
  correctPositions: number
  totalPositions: number
}

export interface OrderingQuizMetrics extends OrderingQuizScore {
  timeTaken: number // milliseconds
  speedRating: "Very Fast" | "Fast" | "Average" | "Slow" | "Very Slow"
  speedPercentage: number // How much faster than average
  stepExplanations: StepExplanation[]
}

export interface StepExplanation {
  stepNumber: number
  userPosition: number
  correctPosition: number
  isCorrect: boolean
  message: string
}

interface ScoringConfig {
  perfectTimeMs: number // Expected perfect time
  averageTimeMs: number // Average completion time
  speedBonus: boolean // Enable speed-based bonus points
}

const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  perfectTimeMs: 30000, // 30 seconds for perfect completion
  averageTimeMs: 120000, // 2 minutes average
  speedBonus: true,
}

/**
 * Calculate the ordering quiz score based on user answer vs correct answer
 * Uses all-or-nothing grading: must be in exact correct order
 */
function calculateScore(
  userOrder: number[],
  correctOrder: number[],
  config: Partial<ScoringConfig> = {}
): OrderingQuizScore {
  const finalConfig = { ...DEFAULT_SCORING_CONFIG, ...config }

  // Validate inputs
  if (!Array.isArray(userOrder) || !Array.isArray(correctOrder)) {
    throw new Error("Both userOrder and correctOrder must be arrays")
  }

  if (userOrder.length !== correctOrder.length) {
    throw new Error("userOrder and correctOrder must have same length")
  }

  if (userOrder.length === 0) {
    throw new Error("Order arrays cannot be empty")
  }

  // Calculate exact match (all-or-nothing)
  const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder)

  // Calculate accuracy: percentage of items in correct position
  let correctPositions = 0
  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) {
      correctPositions++
    }
  }

  const accuracy = Math.round((correctPositions / correctOrder.length) * 100)

  // Score determination
  let score = isCorrect ? 100 : Math.max(0, accuracy - 20) // Partial credit with penalty

  // Assign grade based on accuracy
  const grade = assignGrade(accuracy)

  return {
    isCorrect,
    score,
    accuracy,
    grade,
    correctPositions,
    totalPositions: correctOrder.length,
  }
}

/**
 * Assign letter grade based on accuracy percentage
 */
function assignGrade(
  accuracy: number
): "A" | "B" | "C" | "D" | "F" {
  if (accuracy >= 90) return "A"
  if (accuracy >= 80) return "B"
  if (accuracy >= 70) return "C"
  if (accuracy >= 60) return "D"
  return "F"
}

/**
 * Calculate accuracy as percentage of correct positions
 */
function calculateAccuracy(
  userOrder: number[],
  correctOrder: number[]
): number {
  if (userOrder.length === 0 || correctOrder.length === 0) {
    return 0
  }

  if (userOrder.length !== correctOrder.length) {
    return 0
  }

  let correct = 0
  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) {
      correct++
    }
  }

  return Math.round((correct / correctOrder.length) * 100)
}

/**
 * Calculate speed rating based on time taken
 */
function calculateSpeedRating(
  timeTakenMs: number,
  config: Partial<ScoringConfig> = {}
): {
  rating: "Very Fast" | "Fast" | "Average" | "Slow" | "Very Slow"
  speedPercentage: number
} {
  const finalConfig = { ...DEFAULT_SCORING_CONFIG, ...config }
  const { perfectTimeMs, averageTimeMs } = finalConfig

  // Calculate speed as percentage relative to average
  const speedPercentage = Math.round((averageTimeMs / Math.max(timeTakenMs, 1)) * 100)

  let rating: "Very Fast" | "Fast" | "Average" | "Slow" | "Very Slow"

  if (timeTakenMs <= perfectTimeMs) {
    rating = "Very Fast"
  } else if (timeTakenMs <= averageTimeMs * 0.75) {
    rating = "Fast"
  } else if (timeTakenMs <= averageTimeMs * 1.5) {
    rating = "Average"
  } else if (timeTakenMs <= averageTimeMs * 2.5) {
    rating = "Slow"
  } else {
    rating = "Very Slow"
  }

  return { rating, speedPercentage }
}

/**
 * Generate detailed step explanations for user feedback
 */
function generateStepExplanations(
  userOrder: number[],
  correctOrder: number[],
  stepLabels: string[]
): StepExplanation[] {
  return correctOrder.map((correctValue, index) => {
    const userIndex = userOrder.indexOf(correctValue)
    const isCorrect = userIndex === index
    const userPosition = userIndex + 1
    const correctPosition = index + 1

    let message = ""
    if (isCorrect) {
      message = `✓ "${stepLabels[correctValue]}" is in the correct position`
    } else if (userIndex === -1) {
      message = `✗ "${stepLabels[correctValue]}" was not placed`
    } else {
      message = `✗ "${stepLabels[correctValue]}" is in position ${userPosition} but should be in position ${correctPosition}`
    }

    return {
      stepNumber: index + 1,
      userPosition,
      correctPosition,
      isCorrect,
      message,
    }
  })
}

/**
 * Calculate comprehensive metrics for quiz attempt
 */
function calculateMetrics(
  userOrder: number[],
  correctOrder: number[],
  timeTakenMs: number,
  stepLabels: string[],
  config: Partial<ScoringConfig> = {}
): OrderingQuizMetrics {
  const score = calculateScore(userOrder, correctOrder, config)
  const { rating: speedRating, speedPercentage } = calculateSpeedRating(timeTakenMs, config)
  const stepExplanations = generateStepExplanations(userOrder, correctOrder, stepLabels)

  return {
    ...score,
    timeTaken: timeTakenMs,
    speedRating,
    speedPercentage,
    stepExplanations,
  }
}

/**
 * Get human-readable feedback based on metrics
 */
export function getPerformanceFeedback(metrics: OrderingQuizMetrics): string {
  const { isCorrect, accuracy, speedRating, grade } = metrics

  if (isCorrect) {
    return `Perfect! 🎉 You completed the sequence correctly in ${speedRating.toLowerCase()} time!`
  }

  if (accuracy >= 80) {
    return `Great effort! You got ${accuracy}% correct. Just need to adjust a few positions.`
  }

  if (accuracy >= 60) {
    return `Good try! You got ${accuracy}% correct. Review the explanations to improve.`
  }

  return `Keep practicing! You got ${accuracy}% correct. Grade: ${grade}`
}

/**
 * Calculate improvement suggestions
 */
export function getImprovementSuggestions(
  metrics: OrderingQuizMetrics
): string[] {
  const suggestions: string[] = []

  if (!metrics.isCorrect && metrics.accuracy < 100) {
    // Check for common patterns
    const incorrectSteps = metrics.stepExplanations.filter((s) => !s.isCorrect)

    if (incorrectSteps.length > 0) {
      suggestions.push(
        `Focus on the placement of these steps: ${incorrectSteps.map((s) => `step ${s.stepNumber}`).join(", ")}`
      )
    }
  }

  if (
    metrics.speedRating === "Very Slow" ||
    metrics.speedRating === "Slow"
  ) {
    suggestions.push("Take more time to understand the sequence before ordering")
  }

  if (
    metrics.speedRating === "Very Fast" &&
    !metrics.isCorrect
  ) {
    suggestions.push("Slow down and carefully consider each position")
  }

  if (suggestions.length === 0) {
    suggestions.push("Try a more difficult quiz to challenge yourself further")
  }

  return suggestions
}

/**
 * Format time duration to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Compare current performance with user's average
 */
interface PerformanceComparison {
  improvement: "better" | "worse" | "same"
  differencePercent: number
  message: string
}

function comparePerformance(
  currentScore: number,
  averageScore: number
): PerformanceComparison {
  if (averageScore === 0) {
    return {
      improvement: "same",
      differencePercent: 0,
      message: "This is your first attempt!",
    }
  }

  const difference = currentScore - averageScore
  const differencePercent = Math.round((difference / averageScore) * 100)

  if (difference > 0) {
    return {
      improvement: "better",
      differencePercent,
      message: `🎯 ${differencePercent}% better than your average of ${averageScore}!`,
    }
  }

  if (difference < 0) {
    return {
      improvement: "worse",
      differencePercent: Math.abs(differencePercent),
      message: `${Math.abs(differencePercent)}% lower than your average of ${averageScore}`,
    }
  }

  return {
    improvement: "same",
    differencePercent: 0,
    message: "Same as your average",
  }
}
