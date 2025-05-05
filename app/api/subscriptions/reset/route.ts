import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin user
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Parse request body
    const { userId, resetType, reason = "Admin reset" } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!resetType || !["free", "inactive"].includes(resetType)) {
      return NextResponse.json({ error: "Valid reset type (free or inactive) is required" }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get current subscription status (for audit log)
    const previousState = {
      userType: user.userType,
      subscriptionStatus: user.subscription?.status || "NONE",
      subscriptionPlan: user.subscription?.planId || "NONE",
    }

    // Perform database operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user type
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          userType: "FREE",
        },
      })

      // Handle subscription update
      if (user.subscription) {
        // Record the transaction
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits: 0,
            type: resetType === "free" ? "SUBSCRIPTION_RESET" : "SUBSCRIPTION_DEACTIVATED",
            description:
              reason || `Subscription reset to ${resetType === "free" ? "FREE tier" : "inactive state"} by admin`,
          },
        })

        if (resetType === "inactive") {
          // Set subscription to inactive
          await tx.userSubscription.update({
            where: { userId },
            data: {
              status: "INACTIVE",
              planId: user.subscription.planId, // Keep the same plan but mark as inactive
            },
          })
        } else {
          // For free tier, update the subscription
          await tx.userSubscription.update({
            where: { userId },
            data: {
              status: "INACTIVE",
              planId: "FREE",
              cancelAtPeriodEnd: true,
            },
          })
        }
      } else if (resetType === "free") {
        // If no subscription exists, create a free one
        await tx.userSubscription.create({
          data: {
            userId,
            status: "INACTIVE",
            planId: "FREE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            cancelAtPeriodEnd: false,
          },
        })

        // Record the transaction
        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: 0,
            type: "SUBSCRIPTION_CREATED",
            description: "Free subscription created by admin",
          },
        })
      }

      return updatedUser
    })

    return NextResponse.json({
      success: true,
      message: `User subscription has been reset to ${resetType === "free" ? "free tier" : "inactive state"}.`,
      user: {
        id: result.id,
        userType: result.userType,
      },
    })
  } catch (error) {
    console.error("Error resetting subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to reset subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

