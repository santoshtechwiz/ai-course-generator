import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { z } from "zod"

// Update the POST method to handle referral codes
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const schema = z.object({
      userId: z.string(),
      planName: z.string(),
      duration: z.number().int().positive(),
      referralCode: z.string().optional(),
    })

    const validatedData = schema.parse(body)

    // Verify the user is authorized to create a subscription for this userId
    if (session.user.id !== validatedData.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const result = await SubscriptionService.createCheckoutSession(
      validatedData.userId,
      validatedData.planName,
      validatedData.duration,
      validatedData.referralCode,
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error creating subscription:", error)

    if (error.message === "User already has an active subscription") {
      return NextResponse.json({ error: "Subscription conflict", details: error.message }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create subscription", details: error.message }, { status: 500 })
  }
}

