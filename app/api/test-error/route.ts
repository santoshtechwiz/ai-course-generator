import { NextRequest, NextResponse } from "next/server"

/**
 * Test API route to verify error propagation to UI
 * This can be used to test how different error types are handled in the frontend
 */
export async function POST(req: NextRequest) {
  try {
    const { errorType = "generic" } = await req.json()
    
    switch (errorType) {
      case "validation":
        return NextResponse.json(
          {
            success: false,
            error: "Validation Error",
            message: "The request data is invalid. Please check your inputs and try again.",
            errorType: "VALIDATION_ERROR",
          },
          { status: 400 }
        )
        
      case "authentication":
        return NextResponse.json(
          {
            success: false,
            error: "Authentication Error",
            message: "Your session has expired. Please log in again and try again.",
            errorType: "AUTHENTICATION_ERROR",
          },
          { status: 401 }
        )
        
      case "payment":
        return NextResponse.json(
          {
            success: false,
            error: "Payment Error",
            message: "Payment processing failed. Please check your payment details and try again.",
            errorType: "PAYMENT_ERROR",
          },
          { status: 400 }
        )
        
      case "network":
        return NextResponse.json(
          {
            success: false,
            error: "Network Error",
            message: "Network error. Please check your connection and try again.",
            errorType: "NETWORK_ERROR",
          },
          { status: 503 }
        )
        
      case "already_subscribed":
        return NextResponse.json(
          {
            success: false,
            error: "Subscription Conflict",
            message: "You already have an active subscription. You can manage it from your account settings.",
            errorType: "ALREADY_SUBSCRIBED",
          },
          { status: 409 }
        )
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Server Error",
            message: "We encountered an issue while processing your request. Please try again.",
            errorType: "SERVER_ERROR",
          },
          { status: 500 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected Error",
        message: "An unexpected error occurred. Please try again.",
        errorType: "UNEXPECTED_ERROR",
      },
      { status: 500 }
    )
  }
}
