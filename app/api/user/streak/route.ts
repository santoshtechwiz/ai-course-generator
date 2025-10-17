import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserStreakStats } from '@/services/universal-streak'

/**
 * GET /api/user/streak
 * 
 * Fetches current user's streak statistics
 * Works for ALL quiz types (MCQ, Flashcard, Blanks, OpenEnded)
 * 
 * Returns:
 * - currentStreak: Current daily streak
 * - longestStreak: Personal best
 * - lastActivity: Last quiz completion date
 * - isActiveToday: Whether user completed quiz today
 * - needsQuizToday: Whether streak is in danger
 * - daysUntilBreak: Days remaining to maintain streak
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const streakData = await getUserStreakStats(session.user.id)

    return NextResponse.json(streakData)
  } catch (error) {
    console.error('[API] Error fetching user streak:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    )
  }
}
