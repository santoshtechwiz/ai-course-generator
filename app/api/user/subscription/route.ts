import { NextResponse } from "next/server"

import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"


export async function GET() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    include: { subscription: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (!user.subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  return NextResponse.json({
    planId: user.subscription.planId,
    status: user.subscription.status,
    currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    credits: user.credits,
  })
}

