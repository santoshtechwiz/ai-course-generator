import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

import { SubscriptionService } from "@/services/subscription-service"
import { z } from "zod"
import { authOptions } from "@/lib/authOptions"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to access subscription details",
          code: "AUTH_REQUIRED",
        },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Add improved caching headers for better performance
    const headers = new Headers({
      "Cache-Control": "max-age=60, s-maxage=120, stale-while-revalidate=300",
      "Content-Type": "application/json",
    })

    try {
      // Get subscription data with improved error handling
      const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)

      // Get token usage data
      const tokenData = await SubscriptionService.getTokensUsed(userId)

      // Return combined data with better structure
      return NextResponse.json(
        {
          success: true,
          ...subscriptionStatus,
          tokenUsage: tokenData,
          timestamp: new Date().toISOString(),
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
          code: "SERVICE_ERROR",
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
        code: "SERVER_ERROR",
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
          code: "AUTH_REQUIRED",
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
          code: "INVALID_JSON",
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
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    // Handle token purchase action with improved response
    if (validatedData.action === "purchase_tokens") {
      // This would be implemented in a real application
      return NextResponse.json(
        {
          error: "Not Implemented",
          message: "Token purchase is not implemented yet",
          code: "NOT_IMPLEMENTED",
        },
        { status: 501 },
      )
    }

    return NextResponse.json(
      {
        error: "Invalid Action",
        message: "The requested action is not supported",
        code: "INVALID_ACTION",
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
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}

