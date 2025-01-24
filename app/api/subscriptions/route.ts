import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

import type { SubscriptionPlanType } from "@/config/subscriptionPlans"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json({
      credits: 0,
      isSubscribed: false,
      subscriptionPlan: "FREE",
    })
  }

  const credits = session.user.credits ?? 0
  const subscriptionPlan = (session.user.subscriptionPlan as SubscriptionPlanType) || "FREE"

  return NextResponse.json({
    credits,
    isSubscribed: subscriptionPlan !== "FREE",
    subscriptionPlan,
  })
}

