/**
 * Spaced Repetition System - SM-2 Algorithm Implementation
 * 
 * Based on SuperMemo SM-2 algorithm for optimal flashcard scheduling
 * Ref: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 * 
 * Features:
 * - Ease factor calculation (1.3 to 2.5)
 * - Interval calculation (days until next review)
 * - Quality ratings (0-5 scale)
 * - Automatic difficulty adjustment
 * - Review scheduling
 */

export interface CardReview {
  cardId: string
  quality: number // 0-5 rating (0=complete blackout, 5=perfect recall)
  reviewedAt: Date
}

export interface CardStats {
  easeFactor: number // Minimum 1.3
  interval: number // Days until next review
  repetitions: number // Number of consecutive correct reviews
  nextReview: Date
  lastReview: Date
}

export interface SpacedRepetitionCard {
  id: string
  front: string
  back: string
  easeFactor?: number
  interval?: number
  repetitions?: number
  lastReviewed?: Date
  nextReview?: Date
}

/**
 * SM-2 Algorithm Constants
 */
const DEFAULT_EASE_FACTOR = 2.5
const MIN_EASE_FACTOR = 1.3
const INITIAL_INTERVAL = 1 // 1 day
const SECOND_INTERVAL = 6 // 6 days

/**
 * Calculate the next review schedule using SM-2 algorithm
 * 
 * @param currentStats - Current card statistics
 * @param quality - User's quality rating (0-5)
 * @returns Updated card statistics
 */
export function calculateNextReview(
  currentStats: Partial<CardStats>,
  quality: number
): CardStats {
  // Normalize quality to 0-5 if it's in 1-4 range (from UI)
  const normalizedQuality = quality <= 4 ? quality + 1 : quality

  // Initialize defaults
  let easeFactor = currentStats.easeFactor || DEFAULT_EASE_FACTOR
  let interval = currentStats.interval || 0
  let repetitions = currentStats.repetitions || 0

  // SM-2 Algorithm Logic
  if (normalizedQuality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = INITIAL_INTERVAL
    } else if (repetitions === 1) {
      interval = SECOND_INTERVAL
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  } else {
    // Incorrect response - reset repetitions and start over
    repetitions = 0
    interval = INITIAL_INTERVAL
  }

  // Update ease factor
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - normalizedQuality) * (0.08 + (5 - normalizedQuality) * 0.02))
  )

  // Calculate next review date
  const now = new Date()
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    repetitions,
    nextReview,
    lastReview: now,
  }
}

/**
 * Convert UI difficulty rating (1-4) to SM-2 quality (0-5)
 * 
 * UI Ratings:
 * 1 = Again (Complete blackout) → 0
 * 2 = Hard (Incorrect but remembered) → 2
 * 3 = Good (Correct with effort) → 4
 * 4 = Easy (Perfect recall) → 5
 */
export function difficultyToQuality(difficulty: number): number {
  const mapping: Record<number, number> = {
    1: 0, // Again
    2: 2, // Hard
    3: 4, // Good
    4: 5, // Easy
  }
  return mapping[difficulty] || 3
}

/**
 * Filter cards that are due for review
 * 
 * @param cards - Array of flashcards with review data
 * @returns Cards that need to be reviewed today
 */
export function getDueCards(cards: SpacedRepetitionCard[]): SpacedRepetitionCard[] {
  const now = new Date()

  return cards.filter((card) => {
    // No next review date = new card, should be reviewed
    if (!card.nextReview) return true

    // Check if next review date has passed
    return new Date(card.nextReview) <= now
  })
}

/**
 * Sort cards by priority (most overdue first)
 * 
 * @param cards - Array of flashcards
 * @returns Sorted array with most overdue cards first
 */
export function sortCardsByPriority(cards: SpacedRepetitionCard[]): SpacedRepetitionCard[] {
  const now = new Date()

  return [...cards].sort((a, b) => {
    // New cards (no review history) come first
    if (!a.nextReview && b.nextReview) return -1
    if (a.nextReview && !b.nextReview) return 1
    if (!a.nextReview && !b.nextReview) return 0

    // Sort by how overdue they are
    const aOverdue = now.getTime() - new Date(a.nextReview!).getTime()
    const bOverdue = now.getTime() - new Date(b.nextReview!).getTime()

    return bOverdue - aOverdue
  })
}

/**
 * Get review statistics for a deck
 * 
 * @param cards - Array of flashcards
 * @returns Statistics about the deck
 */
export function getDeckStats(cards: SpacedRepetitionCard[]) {
  const now = new Date()
  const dueCards = getDueCards(cards)

  const newCards = cards.filter((card) => !card.lastReviewed).length
  const learningCards = cards.filter(
    (card) => card.repetitions && card.repetitions < 3
  ).length
  const matureCards = cards.filter((card) => card.repetitions && card.repetitions >= 3).length

  const averageEaseFactor =
    cards.reduce((sum, card) => sum + (card.easeFactor || DEFAULT_EASE_FACTOR), 0) /
      cards.length || DEFAULT_EASE_FACTOR

  const nextReviewDate = cards
    .filter((card) => card.nextReview)
    .map((card) => new Date(card.nextReview!))
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return {
    total: cards.length,
    due: dueCards.length,
    new: newCards,
    learning: learningCards,
    mature: matureCards,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    nextReview: nextReviewDate,
  }
}

/**
 * Get recommended daily review count
 * 
 * @param totalCards - Total number of cards in deck
 * @returns Recommended number of new cards per day
 */
export function getRecommendedDailyReviews(totalCards: number): number {
  if (totalCards <= 20) return 5
  if (totalCards <= 50) return 10
  if (totalCards <= 100) return 15
  return 20
}

/**
 * Calculate retention rate for a deck
 * 
 * @param cards - Array of flashcards with review history
 * @returns Retention percentage (0-100)
 */
export function calculateRetentionRate(cards: SpacedRepetitionCard[]): number {
  const cardsWithHistory = cards.filter((card) => card.repetitions && card.repetitions > 0)

  if (cardsWithHistory.length === 0) return 0

  const matureCards = cardsWithHistory.filter((card) => card.repetitions! >= 3).length

  return Math.round((matureCards / cardsWithHistory.length) * 100)
}

/**
 * Get forecast for upcoming reviews
 * 
 * @param cards - Array of flashcards
 * @param days - Number of days to forecast
 * @returns Array of review counts per day
 */
export function getForecast(cards: SpacedRepetitionCard[], days: number = 7): number[] {
  const forecast: number[] = new Array(days).fill(0)
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today

  cards.forEach((card) => {
    if (!card.nextReview) return

    const reviewDate = new Date(card.nextReview)
    reviewDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor(
      (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff >= 0 && daysDiff < days) {
      forecast[daysDiff]++
    }
  })

  return forecast
}

/**
 * Export deck data for backup
 * 
 * @param cards - Array of flashcards
 * @returns JSON string of deck data
 */
export function exportDeck(cards: SpacedRepetitionCard[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: cards.map((card) => ({
        ...card,
        lastReviewed: card.lastReviewed?.toISOString(),
        nextReview: card.nextReview?.toISOString(),
      })),
    },
    null,
    2
  )
}

/**
 * Import deck data from backup
 * 
 * @param jsonData - JSON string of deck data
 * @returns Array of flashcards
 */
export function importDeck(jsonData: string): SpacedRepetitionCard[] {
  try {
    const data = JSON.parse(jsonData)

    return data.cards.map((card: any) => ({
      ...card,
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
      nextReview: card.nextReview ? new Date(card.nextReview) : undefined,
    }))
  } catch (error) {
    console.error('[SpacedRepetition] Error importing deck:', error)
    return []
  }
}

/**
 * Reset card progress (useful for relearning)
 * 
 * @param card - Flashcard to reset
 * @returns Card with reset stats
 */
export function resetCard(card: SpacedRepetitionCard): SpacedRepetitionCard {
  return {
    ...card,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    lastReviewed: undefined,
    nextReview: undefined,
  }
}

/**
 * Get performance metrics for analytics
 * 
 * @param reviews - Array of card reviews
 * @returns Performance metrics
 */
export function getPerformanceMetrics(reviews: CardReview[]) {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageQuality: 0,
      accuracy: 0,
      streak: 0,
    }
  }

  const totalReviews = reviews.length
  const averageQuality = reviews.reduce((sum, r) => sum + r.quality, 0) / totalReviews
  const correctReviews = reviews.filter((r) => r.quality >= 3).length
  const accuracy = (correctReviews / totalReviews) * 100

  // Calculate current streak
  let streak = 0
  for (let i = reviews.length - 1; i >= 0; i--) {
    if (reviews[i].quality >= 3) {
      streak++
    } else {
      break
    }
  }

  return {
    totalReviews,
    averageQuality: Math.round(averageQuality * 100) / 100,
    accuracy: Math.round(accuracy),
    streak,
  }
}
