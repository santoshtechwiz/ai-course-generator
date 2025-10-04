import { type NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/server-auth"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/db"

/**
 * Subscription Status Route - Simplified Session-Based Approach
 * Returns subscription data based on session information for consistency
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    
    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        credits: true,
        creditsUsed: true,
        userType: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Session-authoritative approach - use session data as primary source
    const sessionCredits = session.user.credits || 0;
    const sessionUsed = session.user.creditsUsed || 0;
    const sessionPlan = (session.user as any)?.plan || 
                       (session.user as any)?.subscriptionPlan || 
                       (session.user as any)?.userType || 
                       user.userType || 'FREE';

    // Build response with session as authority
    const response = {
      id: user.id,
      userId: user.id,
      subscriptionId: '',
      credits: sessionCredits,
      tokensUsed: sessionUsed, // Use session creditsUsed for consistency
      isSubscribed: true,
      subscriptionPlan: sessionPlan.toUpperCase(),
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
      expirationDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: "session_authoritative_api",
        timestamp: new Date().toISOString(),
        sessionCredits,
        sessionUsed,
        sessionPlan,
        dbCreditsUsed: user.creditsUsed
      }
    }
    
    logger.info(`[API] Session-authoritative subscription for user ${userId}: plan=${response.subscriptionPlan}, credits=${response.credits}`)
    
    return NextResponse.json(response)
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    logger.error(`Error fetching subscription status: ${errorMessage}`)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
