import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { streakService } from "@/services/streak.service"

/**
 * GET /api/flashcards/streak
 * Get user's streak information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const streakInfo = await streakService.getStreakInfo(session.user.id)
    const streakDanger = await streakService.getStreakDanger(session.user.id)

    return NextResponse.json({
      current: streakInfo.current,
      longest: streakInfo.longest,
      lastReview: streakInfo.lastReview,
      inDanger: streakDanger.inDanger,
      hoursRemaining: streakDanger.hoursRemaining,
    })
  } catch (error) {
    console.error("[API] Error fetching streak:", error)
    return NextResponse.json(
      { error: "Failed to fetch streak" },
      { status: 500 }
    )
  }
}
