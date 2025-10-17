/**
 * Unified Quiz Progress API
 * 
 * COMMIT: Single endpoint to fetch progress across all quiz types
 * Replaces fragmented calls to /api/flashcards/stats, /api/quiz/attempts, etc.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const quizType = searchParams.get('type') // Optional filter: 'mcq', 'flashcard', etc.
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log(`[API] Fetching unified progress for user ${session.user.id}`, {
      quizType,
      limit
    })
    
    // COMMIT: Fetch all quiz attempts in single query
    const attempts = await prisma.userQuizAttempt.findMany({
      where: {
        userId: session.user.id,
        ...(quizType && quizType !== 'flashcard' && {
          userQuiz: {
            quizType: quizType as any
          }
        })
      },
      include: {
        userQuiz: {
          select: {
            id: true,
            title: true,
            quizType: true,
            difficulty: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    // COMMIT: Fetch flashcard reviews (separate table)
    const flashcardReviews = !quizType || quizType === 'flashcard' 
      ? await prisma.flashCardReview.findMany({
          where: { userId: session.user.id },
          include: {
            flashCard: {
              select: {
                id: true,
                question: true
              }
            }
          },
          orderBy: { reviewDate: 'desc' },
          take: limit
        })
      : []
    
    // COMMIT: Calculate unified stats
    const totalAttempts = attempts.length + flashcardReviews.length
    const averageScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length 
      : 0
    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(a => a.score || 0))
      : 0
    
    // COMMIT: Get streak info (shared across all types)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        longestStreak: true,
        lastReviewDate: true
      }
    })
    
    // COMMIT: Get badge count (fallback to 0 if model not accessible)
    let badgeCount = 0
    try {
      badgeCount = await (prisma as any).userBadge.count({
        where: { userId: session.user.id }
      })
    } catch (error) {
      console.warn('[API] UserBadge model not accessible:', error)
    }
    
    // COMMIT: Calculate mastery stats for flashcards
    const masteredCards = flashcardReviews.filter(r => 
      r.easeFactor && Number(r.easeFactor) >= 2.5 && r.interval && r.interval >= 21
    ).length
    
    const learningCards = flashcardReviews.filter(r => 
      r.interval && r.interval > 0 && r.interval < 21
    ).length
    
    console.log(`[API] Unified progress fetched:`, {
      totalAttempts,
      averageScore: Math.round(averageScore),
      streak: user?.streak || 0
    })
    
    return NextResponse.json({
      attempts,
      flashcardReviews,
      stats: {
        totalAttempts,
        averageScore: Math.round(averageScore),
        bestScore,
        totalTimeSpent,
        streak: user?.streak || 0,
        longestStreak: user?.longestStreak || 0,
        lastActivity: user?.lastReviewDate,
        badgesEarned: badgeCount,
        flashcardMastery: {
          mastered: masteredCards,
          learning: learningCards,
          total: flashcardReviews.length
        }
      }
    })
  } catch (error) {
    console.error('[API] Error fetching unified progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
