import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

import type { SubscriptionPlanType } from "@/config/subscriptionPlans"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/db"

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
  const subscriptions = await prisma.userSubscription.findMany({
    include: {
      user: true,
    },
  }).then(subscriptions => subscriptions.map(subscription => ({
    ...subscription,
    name: subscription.user.name,
    email: subscription.user.email,
  })));

  return NextResponse.json({
    credits,
    isSubscribed: subscriptionPlan !== "FREE",
    subscriptionPlan,
    subscription:subscriptions,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, planId, status } = body

    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Error creating subscription" }, { status: 500 })
  }
}

// export async function DELETE(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const id = searchParams.get("id")

//     if (!id) {
//       return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
//     }

//     await prisma.userSubscription.delete({
//       where: { id },
//     })

//     return NextResponse.json({ message: "Subscription deleted successfully" })
//   } catch (error) {
//     console.error("Error deleting subscription:", error)
//     return NextResponse.json({ error: "Error deleting subscription" }, { status: 500 })
//   }
// }