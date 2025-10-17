import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { flashcardScheduler } from "@/services/flashcard-scheduler.service"

/**
 * GET /api/flashcards/stats
 * Get user's review statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    const stats = await flashcardScheduler.getReviewStats(session.user.id)
    const dailyReviews = await flashcardScheduler.getDailyReviews(session.user.id, days)

    return NextResponse.json({
      ...stats,
      dailyReviews,
    })
  } catch (error) {
    console.error("[API] Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
