import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getServerAuthSession } from "@/lib/server-auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        credits: true,
        creditsUsed: true,
        subscription: {
          select: {
            id: true,
            planId: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    })
    console.log("Fetched user subscription data:", user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = user.subscription
    const isActive = subscription?.status.toLowerCase() === "active"
    const isExpired = subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()

    const response = {
      credits: typeof user.credits === "number" ? user.credits : 0,
      tokensUsed: typeof user.creditsUsed === "number" ? user.creditsUsed : 0,
      isSubscribed: !!subscription && isActive && !isExpired,
      subscriptionPlan: subscription?.planId || "FREE",
      expirationDate: subscription?.currentPeriodEnd?.toISOString() || null,
      status: isExpired ? "EXPIRED" : subscription?.status || "INACTIVE",
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Subscription status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
