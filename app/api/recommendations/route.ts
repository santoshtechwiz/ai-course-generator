import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { initializeAIServices } from "@/app/aimodel"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      // Return empty recommendations for unauthenticated users
      return NextResponse.json({
        success: true,
        recommendations: [],
        count: 0,
        message: "Please sign in to get personalized recommendations"
      })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '5', 10)
    const type = searchParams.get('type') || 'mixed' // 'content', 'collaborative', 'ai', 'mixed'

    // Initialize AI services
    const { recommendationService } = await initializeAIServices()

    // Get recommendations using new AI service
    const recommendations = await recommendationService.process(
      {
        userId,
        type: type === 'mixed' ? 'mixed' : (type as 'course' | 'quiz'),
        limit,
        includeExplanation: true,
        forceRefresh: false
      },
      {
        userId,
        isSubscribed: true, // You can add proper subscription check here
        metadata: {
          userType: session.user.userType || 'FREE'
        }
      }
    )

    return NextResponse.json({
      success: true,
      recommendations: recommendations.recommendations,
      count: recommendations.recommendations.length,
      totalCount: recommendations.totalCount,
      generatedAt: recommendations.generatedAt
    })

  } catch (error) {
    console.error("Recommendations API error:", error)

    // Return empty recommendations on error instead of failing
    return NextResponse.json({
      success: true,
      recommendations: [],
      count: 0,
      error: "Unable to generate recommendations at this time"
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { action, data } = await req.json()

    if (action === "invalidate_cache") {
      // TODO: Implement cache invalidation with new AI service
      return NextResponse.json({ success: true, message: "Cache invalidation not yet implemented" })
    }

    if (action === "update_activity") {
      // TODO: Implement activity update with new AI service  
      return NextResponse.json({ success: true, message: "Activity update not yet implemented" })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Recommendations API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
