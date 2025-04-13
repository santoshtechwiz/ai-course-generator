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

    if (!subscription) {
      return NextResponse.json({
        active: false,
        plan: null,
        status: null,
        expiresAt: null,
      })
    }

    const isActive =
      subscription.status === "active" ||
      (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date())

    return NextResponse.json({
      active: isActive,
      plan: subscription.planId,
      status: subscription.status,
      expiresAt: subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error("Subscription status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
