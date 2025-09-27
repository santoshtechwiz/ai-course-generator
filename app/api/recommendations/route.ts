import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { initializeAIServices } from "@/app/aimodel"

// Helper function to check subscription status
async function checkSubscriptionStatus(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/subscriptions/status?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return { isSubscribed: false, error: 'Failed to check subscription' }
    }

    const data = await response.json()
    return {
      isSubscribed: data.isSubscribed || false,
      subscriptionPlan: data.subscriptionPlan,
      credits: data.credits || 0
    }
  } catch (error) {
    console.error('Subscription check error:', error)
    return { isSubscribed: false, error: 'Subscription check failed' }
  }
}

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
    const useAI = searchParams.get('ai') === 'true' // NEW: Enable AI recommendations

    // Initialize AI services
    const { recommendationService } = await initializeAIServices()

    // Get recommendations using new AI service
    const recommendations = await recommendationService.process(
      {
        userId,
        type: type === 'mixed' ? 'mixed' : (type as 'course' | 'quiz'),
        limit,
        includeExplanation: true,
        forceRefresh: false,
        useAI // NEW: Pass AI flag
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
    }, {
      headers: {
        'Cache-Control': 'max-age=1800, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
      }
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

    // Safely parse JSON with error handling
    let requestData
    try {
      const body = await req.text()
      if (!body.trim()) {
        return NextResponse.json(
          { error: "Request body is required" },
          { status: 400 }
        )
      }
      requestData = JSON.parse(body)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { action, data } = requestData

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required" },
        { status: 400 }
      )
    }

    if (action === "invalidate_cache") {
      // TODO: Implement cache invalidation with new AI service
      return NextResponse.json({ success: true, message: "Cache invalidation not yet implemented" })
    }

    if (action === "generate_quiz") {
      // Redirect to quiz creation form with suggested data
      // Check if user is subscribed and has credits
      const { topic, difficulty, questionCount, basedOn, userContext } = data || {}

      if (!topic || !difficulty) {
        return NextResponse.json(
          { error: "Topic and difficulty are required for quiz generation" },
          { status: 400 }
        )
      }

      // Check subscription status
      const subscriptionCheck = await checkSubscriptionStatus(userId)
      if (!subscriptionCheck.isSubscribed) {
        return NextResponse.json(
          {
            error: "Subscription required",
            message: "You need an active subscription to create custom quizzes",
            redirectTo: "/dashboard/subscription"
          },
          { status: 403 }
        )
      }

      // Check credits
      const creditService = (await import("@/services/credit-service")).creditService
      const creditDetails = await creditService.getCreditDetails(userId)

      if (!creditDetails.canProceed) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            message: "You don't have enough credits to create a quiz",
            redirectTo: "/dashboard/subscription"
          },
          { status: 402 }
        )
      }

      // Prepare suggested data for quiz creation
      const suggestedData = {
        title: `${topic} Quiz`,
        topic: topic,
        difficulty: difficulty,
        questionCount: questionCount || 5,
        basedOn: basedOn || 'learning_gap',
        userContext: userContext || {},
        suggestedPrompt: `Create a ${difficulty} level quiz about ${topic} with ${questionCount || 5} questions based on ${basedOn || 'learning_gap'}.`
      }

      // Redirect to quiz creation form with suggested data
      const redirectUrl = `/dashboard/quiz/mcq?${new URLSearchParams({
        suggested: 'true',
        data: JSON.stringify(suggestedData)
      }).toString()}`

      return NextResponse.json({
        success: true,
        redirectTo: redirectUrl,
        message: "Redirecting to quiz creation form with your suggestions",
        suggestedData: suggestedData
      })
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
