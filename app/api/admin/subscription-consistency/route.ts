import { NextRequest, NextResponse } from "next/server"
import { getAuthSession, isAdmin } from "@/lib/auth"
import { SubscriptionService } from "@/modules/subscriptions"
import { prisma } from "@/lib/db"

/**
 * Admin API endpoint to validate and fix subscription data consistency
 * GET /api/admin/subscription-consistency - Check consistency for all users or specific user
 * POST /api/admin/subscription-consistency - Fix inconsistencies for all users or specific user
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const fix = searchParams.get("fix") === "true"

    if (userId) {
      // Check consistency for specific user
      const result = await SubscriptionService.getSubscriptionStatus(userId)
      
      if (fix && !result.isConsistent) {
        const fixResult = await SubscriptionService.refreshSubscription(userId)
        return NextResponse.json({
          userId,
          validation: result,
          fix: fixResult,
        })
      }
      
      return NextResponse.json({
        userId,
        validation: result,
      })
    }

    // Check consistency for all users using SQL function
    const inconsistentUsers = await prisma.$queryRaw`
      SELECT * FROM validate_subscription_consistency() 
      WHERE is_inconsistent = true 
      LIMIT 100
    ` as any[]

    const summary = {
      totalInconsistent: inconsistentUsers.length,
      issues: inconsistentUsers.reduce((acc, user) => {
        const issue = user.issue_description
        acc[issue] = (acc[issue] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    if (fix && inconsistentUsers.length > 0) {      const fixResults = await Promise.all(
        inconsistentUsers.slice(0, 10).map(async (user) => { // Limit to 10 for safety
          const fixResult = await SubscriptionService.refreshSubscription(user.user_id)
          return {
            userId: user.user_id,
            email: user.email,
            issue: user.issue_description,
            fix: fixResult,
          }
        })
      )

      return NextResponse.json({
        summary,
        inconsistentUsers: inconsistentUsers.slice(0, 20), // Return first 20 for review
        fixResults,
      })
    }

    return NextResponse.json({
      summary,
      inconsistentUsers: inconsistentUsers.slice(0, 20), // Return first 20 for review
    })
  } catch (error) {
    console.error("Error in subscription consistency check:", error)
    return NextResponse.json(
      { error: "Failed to check subscription consistency" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }    const body = await req.json()
    const { userId, fixAll = false } = body

    if (userId) {
      // Fix specific user
      const validation = await SubscriptionService.getSubscriptionStatus(userId)
      
      if (!validation.isConsistent) {
        const fixResult = await SubscriptionService.refreshSubscription(userId)
        return NextResponse.json({
          userId,
          validation,
          fix: fixResult,
        })
      }
      
      return NextResponse.json({
        userId,
        validation,
        message: "User data is already consistent",
      })
    }

    if (fixAll) {
      // Get all inconsistent users
      const inconsistentUsers = await prisma.$queryRaw`
        SELECT user_id FROM validate_subscription_consistency() 
        WHERE is_inconsistent = true 
        LIMIT 50
      ` as any[]

      const fixResults = await Promise.all(        inconsistentUsers.map(async (user) => {
          const fixResult = await SubscriptionService.refreshSubscription(user.user_id)
          return {
            userId: user.user_id,
            fix: fixResult,
          }
        })
      )

      const successCount = fixResults.filter(r => r.fix.success).length
      const failureCount = fixResults.filter(r => !r.fix.success).length

      return NextResponse.json({
        message: `Fixed ${successCount} users, ${failureCount} failures`,
        totalProcessed: inconsistentUsers.length,
        results: fixResults.slice(0, 10), // Return first 10 for review
      })
    }

    return NextResponse.json(
      { error: "Specify userId or set fixAll=true" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error fixing subscription consistency:", error)
    return NextResponse.json(
      { error: "Failed to fix subscription consistency" },
      { status: 500 }
    )
  }
}
