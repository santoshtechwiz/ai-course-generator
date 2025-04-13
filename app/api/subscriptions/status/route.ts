import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = user.subscription

    // Format response to match the expected SubscriptionStatus interface
    const response = {
      credits: user.credits || 0,
      isSubscribed: !!subscription,
      subscriptionPlan: subscription?.planId || "FREE",
      expirationDate: subscription?.currentPeriodEnd?.toISOString() || undefined,
      isActive: subscription?.status === "active" || false,
      // Include original fields for backward compatibility
      active: subscription?.status === "active" || false,
      plan: subscription?.planId || "FREE",
      status: subscription?.status || null,
      expiresAt: subscription?.currentPeriodEnd || null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Subscription status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
