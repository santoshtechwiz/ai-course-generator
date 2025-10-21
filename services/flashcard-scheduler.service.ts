import prisma from "@/lib/db"
import { calculateNextReview, type CardStats } from "@/services/spaced-repetition"
import { startOfDay, sub, differenceInHours } from "date-fns"

/**
 * Flashcard Scheduler Service
 * Integrates SM-2 spaced repetition algorithm with flashcard reviews
 */
class FlashcardSchedulerService {
  /**
   * Schedule next review after user rates a card
   * Maps UI ratings to SM-2 quality scores (0-5)
   */
  async scheduleReview(
    cardId: number,
    userId: string,
    userRating: "correct" | "still_learning" | "incorrect",
    timeSpent: number
  ) {
    // Map user rating to SM-2 quality score
    const qualityMap = {
      correct: 5, // Perfect recall
      still_learning: 3, // Correct with hesitation
      incorrect: 0, // Complete blackout
    }

    // Get existing review stats
    const lastReview = await prisma.flashCardReview.findFirst({
      where: { flashCardId: cardId, userId },
      orderBy: { reviewDate: "desc" },
    })

    // Calculate next review using SM-2
    const currentStats: Partial<CardStats> = {
      easeFactor: lastReview ? Number(lastReview.easeFactor) : 2.5,
      interval: lastReview?.interval || 0,
      repetitions: lastReview?.reviewCount || 0,
    }

    const nextSchedule = calculateNextReview(currentStats, qualityMap[userRating])

    // Save to database
    const review = await prisma.flashCardReview.create({
      data: {
        flashCardId: cardId,
        userId,
        rating: userRating,
        timeSpent,
        reviewCount: nextSchedule.repetitions,
        nextReviewDate: nextSchedule.nextReview,
        easeFactor: nextSchedule.easeFactor,
        interval: nextSchedule.interval,
        notes: JSON.stringify({
          quality: qualityMap[userRating],
          previousInterval: currentStats.interval,
          previousEaseFactor: currentStats.easeFactor,
        }),
      },
    })

    console.log(`[FlashcardScheduler] Scheduled review for card ${cardId}:`, {
      nextReview: nextSchedule.nextReview,
      interval: nextSchedule.interval,
      easeFactor: nextSchedule.easeFactor,
    })

    return { review, nextSchedule }
  }

  /**
   * Get cards due for review today
   */
  async getCardsForReview(userId: string, limit = 20) {
    const cards = await prisma.flashCardReview.findMany({
      where: {
        userId,
        nextReviewDate: { lte: new Date() },
      },
      include: {
        flashCard: {
          include: {
            userQuiz: true,
          },
        },
      },
      orderBy: { nextReviewDate: "asc" },
      take: limit,
    })

    console.log(`[FlashcardScheduler] Found ${cards.length} cards due for review for user ${userId}`)

    return cards
  }

  /**
   * Get review statistics for a user
   */
  async getReviewStats(userId: string) {
    const reviews = await prisma.flashCardReview.findMany({
      where: { userId },
      orderBy: { reviewDate: "desc" },
    })

    const masteredCount = new Set(
      reviews.filter((r) => r.reviewCount >= 3).map((r) => r.flashCardId)
    ).size

    const learningCount = new Set(
      reviews.filter((r) => r.reviewCount > 0 && r.reviewCount < 3).map((r) => r.flashCardId)
    ).size

    const dueCount = await prisma.flashCardReview.count({
      where: {
        userId,
        nextReviewDate: { lte: new Date() },
      },
    })

    const totalReviews = reviews.length

    return {
      masteredCount,
      learningCount,
      dueCount,
      totalReviews,
    }
  }

  /**
   * Get daily review counts for calendar heatmap
   */
  async getDailyReviews(userId: string, days = 30) {
    const startDate = sub(new Date(), { days })

    const reviews = await prisma.flashCardReview.groupBy({
      by: ["reviewDate"],
      where: {
        userId,
        reviewDate: { gte: startDate },
      },
      _count: true,
    })

    return reviews.map((r) => ({
      date: r.reviewDate,
      count: r._count,
    }))
  }
}

export const flashcardScheduler = new FlashcardSchedulerService()
