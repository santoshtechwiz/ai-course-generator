import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/services/subscription/subscription-service"

// Define cache control constants for better performance
const CACHE_CONTROL = {
  PRODUCTION: "max-age=60, s-maxage=120, stale-while-revalidate=300",
  DEVELOPMENT: "no-cache, no-store",
}

// Adding consistent error handling and better typed responses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to access subscription details",
          code: "AUTH_REQUIRED",
        },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Define cache control for better performance
    const cacheControl = process.env.NODE_ENV === "production" ? CACHE_CONTROL.PRODUCTION : CACHE_CONTROL.DEVELOPMENT

    const headers = new Headers({
      "Cache-Control": cacheControl,
      "Content-Type": "application/json",
    })

    try {
      // Get subscription data and token usage in parallel for better performance
      const [subscriptionStatus, tokenData] = await Promise.all([
        SubscriptionService.getSubscriptionStatus(userId),
        SubscriptionService.getTokensUsed(userId),
      ])

      // Return structured response with consistent fields
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
          success: false,
          error: "Service Error",
          message: "Failed to fetch subscription data",
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
        success: false,
        error: "Server Error",
        message: "An unexpected error occurred",
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
          success: false,
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
          success: false,
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
          success: false,
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
      try {
        // This would be implemented in a real application
        // For now, return a not implemented response
        return NextResponse.json(
          {
            success: false,
            error: "Not Implemented",
            message: "Token purchase is not implemented yet",
            code: "NOT_IMPLEMENTED",
          },
          { status: 501 },
        )
      } catch (purchaseError: any) {
        return NextResponse.json(
          {
            success: false,
            error: "Purchase Error",
            message: purchaseError.message || "Failed to purchase tokens",
            code: "PURCHASE_ERROR",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
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
        success: false,
        error: "Server Error",
        message: "An unexpected error occurred while processing your request",
        details: error.message,
        code: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
