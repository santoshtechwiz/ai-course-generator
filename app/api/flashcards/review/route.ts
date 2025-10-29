import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { flashcardScheduler } from "@/services/flashcard-scheduler.service"
import { streakService } from "@/services/streak.service"
import { badgeService } from "@/services/badge.service"
import { usageLimitService } from "@/services/usage-limit.service"
import { emailService } from "@/services/email.service"
import { SUBSCRIPTION_PLAN_IDS, isFreePlan } from '@/types/subscription-plans'

/**
 * POST /api/flashcards/review
 * Save flashcard review with spaced repetition scheduling
 * OPTIMIZED: Non-blocking operations to prevent UI freeze
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await req.json()
    const { cardId, rating, timeSpent } = body

    if (!cardId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["correct", "still_learning", "incorrect"].includes(rating)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
    }

    // Check usage limits for free users only (optimization)
    const userType = (session.user as any).userType || SUBSCRIPTION_PLAN_IDS.FREE
    if (isFreePlan(userType)) {
      const canReview = await usageLimitService.canUseResource(
        session.user.id,
        'flashcard_reviews',
        userType
      )

      if (!canReview.allowed) {
        return NextResponse.json({
          error: 'Daily review limit reached',
          limit: canReview.limit,
          resetAt: canReview.resetAt,
          upgradeRequired: true
        }, { status: 429 })
      }
    }

    // CRITICAL PATH: Schedule the review using SM-2 algorithm
    const { review, nextSchedule } = await flashcardScheduler.scheduleReview(
      parseInt(cardId),
      session.user.id,
      rating,
      timeSpent || 0
    )

    // NON-BLOCKING: Run all secondary operations in background
    // This prevents UI freeze by not waiting for these to complete
    setImmediate(() => {
      Promise.all([
        // Increment usage count
        usageLimitService.incrementUsage(session.user.id, 'flashcard_reviews'),
        
        // Update streak
        streakService.updateStreak(session.user.id),
        
        // Check and unlock badges
        badgeService.checkAndUnlockBadges(session.user.id).then(newBadges => {
          if (newBadges.length > 0) {
            // Send badge notification emails (fire and forget)
            return Promise.all(
              newBadges.map(async (badge) => {
                const allBadges = await badgeService.getAllBadges()
                const unlockedBadge = allBadges.find(b => b.id === badge.badgeId)
                if (unlockedBadge) {
                  return emailService.scheduleBadgeNotification(
                    session.user.id,
                    unlockedBadge.name,
                    unlockedBadge.icon
                  )
                }
              })
            )
          }
        }),
        
        // Check for streak danger and schedule alert
        streakService.getStreakDanger(session.user.id).then(danger => {
          if (danger.inDanger && danger.hoursRemaining <= 3) {
            return emailService.scheduleStreakAlert(session.user.id, danger.hoursRemaining)
          }
        })
      ]).catch(err => {
        console.error('[API] Background operations error:', err)
        // Don't fail the request if background ops fail
      })
    })

    // Return immediately with essential review data
    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        nextReviewDate: nextSchedule.nextReview,
        interval: nextSchedule.interval,
        easeFactor: nextSchedule.easeFactor,
      }
    })
  } catch (error) {
    console.error("[API] Error in flashcard review:", error)
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    )
  }
}

