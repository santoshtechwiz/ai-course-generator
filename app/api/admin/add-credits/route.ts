import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { SubscriptionService } from '@/services/subscription-services'
import { logger } from "@/lib/logger"

/**
 * Admin endpoint to manually add credits to a user
 * For testing and manual fixes
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real app, you'd check if user is admin
    // For now, just allow any authenticated user for testing
    
    const body = await req.json()
    const { userId, credits, reason } = body
    
    if (!userId || !credits || typeof credits !== 'number') {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, credits (number)' 
      }, { status: 400 })
    }

    if (credits <= 0 || credits > 1000) {
      return NextResponse.json({ 
        error: 'Credits must be between 1 and 1000' 
      }, { status: 400 })
    }

    const success = await SubscriptionService.addCreditsToUser(
      userId, 
      credits, 
      reason || `Manual credit addition by ${session.user.id}`
    )

    if (success) {
      logger.info(`Admin ${session.user.id} added ${credits} credits to user ${userId}`)
      return NextResponse.json({ 
        success: true, 
        message: `Successfully added ${credits} credits to user`,
        userId,
        credits
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to add credits' 
      }, { status: 500 })
    }

  } catch (error: any) {
    logger.error('Error in add-credits endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}