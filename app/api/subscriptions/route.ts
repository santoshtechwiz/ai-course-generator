import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { prisma } from "@/lib/db"
import { z } from "zod"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to access subscription details",
        },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Add caching headers for better performance
    const headers = new Headers({
      "Cache-Control": "max-age=300, s-maxage=300, stale-while-revalidate=600",
    })

    try {
      // Get subscription data
      const subscriptionData = await SubscriptionService.getSubscriptionStatus(userId)

      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      // Get token usage data
      const tokenData = await SubscriptionService.getTokensUsed(userId)

      // Return combined data
      return NextResponse.json(
        {
          ...subscriptionData,
          credits: user?.credits || 0,
          tokenUsage: tokenData,
        },
        { headers },
      )
    } catch (serviceError: any) {
      console.error("Service error fetching subscription:", serviceError)
      return NextResponse.json(
        {
          error: "Service Error",
          message: "Failed to fetch subscription data from service",
          details: serviceError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      {
        error: "Server Error",
        message: "An unexpected error occurred while fetching subscription data",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to perform this action",
        },
        { status: 401 },
      )
    }

    const userId = session.user.id

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid Request",
          message: "Request body must be valid JSON",
        },
        { status: 400 },
      )
    }

    const schema = z.object({
      action: z.enum(["purchase_tokens"]),
      tokenAmount: z.number().int().min(10).max(500),
    })

    try {
      var validatedData = schema.parse(body)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid request data",
          details: (validationError as z.ZodError).errors,
        },
        { status: 400 },
      )
    }

    if (validatedData.action === "purchase_tokens") {
      try {
        const result = await SubscriptionService.purchaseTokens(userId, validatedData.tokenAmount)
        return NextResponse.json(result)
      } catch (serviceError: any) {
        console.error("Service error purchasing tokens:", serviceError)
        return NextResponse.json(
          {
            error: "Service Error",
            message: "Failed to purchase tokens",
            details: serviceError.message,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Invalid Action",
        message: "The requested action is not supported",
      },
      { status: 400 },
    )
  } catch (error: any) {
    console.error("Error processing subscription action:", error)
    return NextResponse.json(
      {
        error: "Server Error",
        message: "An unexpected error occurred while processing your request",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

