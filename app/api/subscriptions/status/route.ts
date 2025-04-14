import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check for cache control headers
    const skipCache = req.headers.get("x-force-refresh") === "true"

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
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = user.subscription
    const isActive = subscription?.status.toLowerCase() === "active"

    console.log("Database user:", {
      id: user.id,
      credits: user.credits,
      subscription,
    })

    const credits = typeof user.credits === "number" ? user.credits : 0
    const tokensUsed = typeof user.creditsUsed === "number" ? user.creditsUsed : 0

    const response = {
      credits,
      tokensUsed,
      isSubscribed: !!subscription && isActive,
      subscriptionPlan: subscription?.planId || "FREE",
      expirationDate: subscription?.currentPeriodEnd?.toISOString() || null,
      isActive,
      active: isActive,
      plan: subscription?.planId || "FREE",
      status: subscription?.status || null,
      expiresAt: subscription?.currentPeriodEnd || null,
    }

    console.log("API response:", response)

    const headers = new Headers()
    if (!skipCache) {
      headers.set("Cache-Control", "max-age=30, s-maxage=30, stale-while-revalidate=60")
    } else {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": headers.get("Cache-Control") || "no-cache",
      },
    })
  } catch (error) {
    console.error("Subscription status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
