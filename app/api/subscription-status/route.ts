import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"


export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ status: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const userSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: userId,
      },
      select: {
        planId: true,
        status: true,
        currentPeriodEnd: true,
      },
    })

    if (!userSubscription) {
      return NextResponse.json({ status: "FREE", planId: null, currentPeriodEnd: null })
    }

    return NextResponse.json({
      status: userSubscription.status,
      planId: userSubscription.planId,
      currentPeriodEnd: userSubscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

