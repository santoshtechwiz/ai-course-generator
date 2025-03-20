import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { z } from "zod"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const subscriptionData = await SubscriptionService.getSubscriptionStatus(userId)

    return NextResponse.json(subscriptionData)
  } catch (error: any) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()

    const schema = z.object({
      action: z.enum(["purchase_tokens"]),
      tokenAmount: z.number().min(10).max(500),
    })

    const validatedData = schema.parse(body)

    if (validatedData.action === "purchase_tokens") {
      const result = await SubscriptionService.purchaseTokens(userId, validatedData.tokenAmount)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error processing subscription action:", error)
    return NextResponse.json(
      { error: "Failed to process subscription action", details: error.message },
      { status: 500 },
    )
  }
}

