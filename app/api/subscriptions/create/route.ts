import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

// Define validation schema for request body with improved type checking
const subscriptionSchema = z.object({
  planId: z.enum(["FREE", "BASIC", "PREMIUM", "ULTIMATE"]),
  duration: z.number().int().positive().lte(12),
  referralCode: z.string().optional(),
  promoCode: z.string().optional(),
  promoDiscount: z.number().min(0).max(100).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to create a subscription",
          errorType: "AUTHENTICATION_REQUIRED",
        },
        { status: 401 },
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Request",
          message: "Request body must be valid JSON",
          errorType: "INVALID_JSON",
        },
        { status: 400 },
      )
    }

    try {
      var validatedData = subscriptionSchema.parse(body)
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          message: "Invalid request data",
          details: (validationError as z.ZodError).errors,
          errorType: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    const userId = session.user.id

    // Check if user already has an active subscription
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    // If user has an active subscription, they can't change plans until it expires
    if (existingSubscription && existingSubscription.status === "ACTIVE" && existingSubscription.planId !== "FREE") {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription Change Restricted",
          message: "You cannot change your subscription until your current plan expires",
          errorType: "PLAN_CHANGE_RESTRICTED",
        },
        { status: 200 },
      )
    }

    // Check if referral code is valid if provided
    if (validatedData.referralCode) {
      const isValidReferral = await SubscriptionService.validatePromoCode(validatedData.referralCode)
      if (!isValidReferral) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid Referral",
            message: "The provided referral code is invalid or expired",
            errorType: "INVALID_REFERRAL",
          },
          { status: 400 },
        )
      }
    }

    // Validate promo code if provided
    if (validatedData.promoCode) {
      const promoValidation = await SubscriptionService.validatePromoCode(validatedData.promoCode)
      if (!promoValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid Promo Code",
            message: "The provided promo code is invalid or expired",
            errorType: "INVALID_PROMO",
          },
          { status: 400 },
        )
      }

      // Use the validated discount percentage from the service
      validatedData.promoDiscount = promoValidation.discount||0;
    }

    // Create a pending subscription record before redirecting to payment
    try {
      await prisma.pendingSubscription.create({
        data: {
          userId,
          planId: validatedData.planId,
          duration: validatedData.duration,
          referralCode: validatedData.referralCode,
          promoCode: validatedData.promoCode,
          promoDiscount: validatedData.promoDiscount,
          status: "PENDING",
          createdAt: new Date(),
        },
      })
    } catch (error) {
      console.error("Error creating pending subscription record:", error)
      // Continue with checkout even if recording fails
    }

    // Create checkout session
    try {
      const result = await SubscriptionService.createCheckoutSession(
        userId,
        validatedData.planId,
        validatedData.duration,
        {
          referralCode: validatedData.referralCode,
          promoCode: validatedData.promoCode,
          promoDiscount: validatedData.promoDiscount,
        }
      )

      return NextResponse.json({
        success: true,
        url: result.url,
      })    } catch (checkoutError: any) {
      console.error("Error creating checkout session:", checkoutError)

      // Provide more user-friendly error messages based on error type
      let userMessage = "We're having trouble processing your subscription. Please try again."
      let errorType = "CHECKOUT_ERROR"

      if (checkoutError.message?.includes("Invalid plan")) {
        userMessage = "The selected plan is not available. Please choose a different plan."
        errorType = "INVALID_PLAN"
      } else if (checkoutError.message?.includes("User already has an active subscription")) {
        userMessage = "You already have an active subscription. You can manage it from your account settings."
        errorType = "ALREADY_SUBSCRIBED"
      } else if (checkoutError.message?.includes("authentication") || checkoutError.message?.includes("API key")) {
        userMessage = "There's a configuration issue on our end. Please contact support."
        errorType = "CONFIGURATION_ERROR"
      } else if (checkoutError.message?.includes("network") || checkoutError.message?.includes("timeout")) {
        userMessage = "Network error. Please check your connection and try again."
        errorType = "NETWORK_ERROR"
      } else if (checkoutError.message?.includes("Card error") || checkoutError.message?.includes("payment")) {
        userMessage = "Payment processing failed. Please check your payment details and try again."
        errorType = "PAYMENT_ERROR"
      }

      return NextResponse.json(
        {
          success: false,
          error: "Checkout Error",
          message: userMessage,
          errorType: errorType,
          details: checkoutError.message, // Technical details for debugging
        },
        { status: 500 },
      )
    }  } catch (error: any) {
    console.error("Error creating subscription:", error)

    // Provide user-friendly error messages
    let userMessage = "We encountered an issue while setting up your subscription. Please try again."
    let statusCode = 500
    let errorType = "SERVER_ERROR"

    if (error.message === "User already has an active subscription") {
      userMessage = "You already have an active subscription. You can manage it from your account settings."
      statusCode = 409
      errorType = "ALREADY_SUBSCRIBED"
    } else if (error.message?.includes("authentication") || error.message?.includes("unauthorized")) {
      userMessage = "Your session has expired. Please log in again and try again."
      statusCode = 401
      errorType = "AUTHENTICATION_ERROR"
    } else if (error.message?.includes("validation") || error.message?.includes("invalid")) {
      userMessage = "The subscription details are invalid. Please check your selection and try again."
      statusCode = 400
      errorType = "VALIDATION_ERROR"
    } else if (error.message?.includes("network") || error.message?.includes("timeout")) {
      userMessage = "Network error. Please check your connection and try again."
      statusCode = 503
      errorType = "NETWORK_ERROR"
    }

    return NextResponse.json(
      {
        success: false,
        error: "Subscription Error",
        message: userMessage,
        errorType: errorType,
        details: error.message, // Technical details for debugging
      },
      { status: statusCode },
    )
  }
}
