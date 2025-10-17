import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { flashcardScheduler } from "@/services/flashcard-scheduler.service"

/**
 * GET /api/flashcards/due
 * Get flashcards due for review
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "20")

    const dueCards = await flashcardScheduler.getCardsForReview(session.user.id, limit)

    return NextResponse.json({
      cards: dueCards,
      count: dueCards.length,
    })
  } catch (error) {
    console.error("[API] Error fetching due cards:", error)
    return NextResponse.json(
      { error: "Failed to fetch due cards" },
      { status: 500 }
    )
  }
}
