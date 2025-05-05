import { NextResponse } from "next/server"

import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: {
      id: true,
      credits: true,
      subscription: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Ensure credits is a number
  const credits = typeof user.credits === "number" ? user.credits : 0

  if (!user.subscription) {
    return NextResponse.json({
      planId: "FREE",
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      credits: credits,
      // Add additional fields for consistency
      subscriptionPlan: "FREE",
      isActive: false,
      isSubscribed: false,
      expirationDate: null,
    })
  }

  return NextResponse.json({
    planId: user.subscription.planId,
    status: user.subscription.status,
    currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    credits: credits,
    // Add additional fields for consistency
    subscriptionPlan: user.subscription.planId,
    isActive: user.subscription.status === "active",
    isSubscribed: user.subscription.status === "active",
    expirationDate: user.subscription.currentPeriodEnd.toISOString(),
  })
}
