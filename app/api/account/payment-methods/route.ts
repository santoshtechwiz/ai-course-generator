import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const paymentMethods = await SubscriptionService.getPaymentMethods(userId)
    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

