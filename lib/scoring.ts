import { compareTwoStrings } from "string-similarity"

export interface ScoringCriteria {
  similarityThreshold: number
  difficultyWeights: {
    easy: number
    medium: number
    hard: number
  }
  bonusPoints: {
    quickAnswer: number // Bonus for answering within timeLimit
    noHints: number // Bonus for not using hints
  }
  timeLimit: number // in seconds
}

const defaultCriteria: ScoringCriteria = {
  similarityThreshold: 0.6,
  difficultyWeights: {
    easy: 1,
    medium: 2,
    hard: 3,
  },
  bonusPoints: {
    quickAnswer: 5,
    noHints: 3,
  },
  timeLimit: 300, // 5 minutes
}

export interface AnswerMetadata {
  answer: string
  timeSpent: number
  hintsUsed: boolean
  difficulty: string
}

export function calculateQuestionScore(
  userAnswer: string,
  correctAnswer: string,
  metadata: AnswerMetadata,
  criteria: ScoringCriteria = defaultCriteria,
): {
  score: number
  similarity: number
  bonuses: { type: string; points: number }[]
} {
  const similarity = compareTwoStrings(userAnswer, correctAnswer)
  
  // Set a minimum similarity threshold
  const minSimilarityThreshold = 0.2;  // Minimum similarity threshold (20%)
  
  // If similarity is below the threshold, return a score of 0
  if (similarity < minSimilarityThreshold) {
    return {
      score: 0,
      similarity,
      bonuses: [],
    }
  }

  const difficultyWeight =
    criteria.difficultyWeights[metadata.difficulty.toLowerCase() as keyof typeof criteria.difficultyWeights] || 1

  // Base score calculation
  let score = Math.round(similarity * 100) * difficultyWeight
  const bonuses: { type: string; points: number }[] = []

  // Add bonus points for quick answers and no hints used
  if (metadata.timeSpent < criteria.timeLimit) {
    score += criteria.bonusPoints.quickAnswer
    bonuses.push({ type: "Quick Answer", points: criteria.bonusPoints.quickAnswer })
  }

  if (!metadata.hintsUsed) {
    score += criteria.bonusPoints.noHints
    bonuses.push({ type: "No Hints Used", points: criteria.bonusPoints.noHints })
  }

  return {
    score,
    similarity,
    bonuses,
  }
}
