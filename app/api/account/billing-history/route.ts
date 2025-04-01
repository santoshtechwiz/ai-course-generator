import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscription-service"


export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const billingHistory = await SubscriptionService.getBillingHistory(userId)
    return NextResponse.json(billingHistory)
  } catch (error) {
    console.error("Error fetching billing history:", error)
    return NextResponse.json({ error: "Failed to fetch billing history" }, { status: 500 })
  }
}

