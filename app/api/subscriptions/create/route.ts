import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/modules/subscriptions"
import StripeGateway from "@/app/dashboard/subscription/services/stripe-gateway"

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
    }    const userId = session.user.id

    // Fetch existing subscription & persistent flags
    const [existingSubscription, userFlags] = await Promise.all([
      prisma.userSubscription.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { hadPreviousPaidPlan: true, hasUsedFreePlan: true } })
    ])
    const existingPlan = existingSubscription?.planId
    const existingStatus = existingSubscription?.status?.toUpperCase()

    const isActivePaid = existingSubscription && existingSubscription.status === 'ACTIVE' && existingPlan !== 'FREE'
    // Use persistent flag
    let hadPreviousPaidPlan = userFlags?.hadPreviousPaidPlan || false

    // 1. Block plan change while active paid subscription
    if (isActivePaid && existingPlan !== validatedData.planId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription Change Restricted',
        message: 'You cannot change your subscription until your current plan expires',
        errorType: 'PLAN_CHANGE_RESTRICTED'
      }, { status: 200 })
    }

    // 2. Block downgrade to FREE if user had paid plan and it has not yet expired
    if (validatedData.planId === 'FREE' && hadPreviousPaidPlan && existingStatus === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'DOWNGRADE_BLOCKED',
        message: 'You can switch to the free plan only after your current subscription expires.',
        errorType: 'DOWNGRADE_BLOCKED'
      }, { status: 200 })
    }

    // 3. Prevent re-subscribing to same active plan
    if (isActivePaid && existingPlan === validatedData.planId) {
      return NextResponse.json({
        success: false,
        error: 'ALREADY_SUBSCRIBED',
        message: 'This plan is already active for your account.',
        errorType: 'ALREADY_SUBSCRIBED'
      }, { status: 200 })
    }

    // 4. If user is moving to a paid plan and has not yet had a paid plan, persist the flag now
    if (validatedData.planId !== 'FREE' && !hadPreviousPaidPlan) {
      try {
        await prisma.user.update({ where: { id: userId }, data: { hadPreviousPaidPlan: true } })
        hadPreviousPaidPlan = true
      } catch (e) {
        // Non-fatal; log server-side if necessary
        console.error('Failed to persist hadPreviousPaidPlan flag', e)
      }
    }

    // Check if user has a recent pending subscription to prevent double-processing
    const recentPendingSubscription = await prisma.pendingSubscription.findFirst({
      where: {
        userId,
        status: "PENDING",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (recentPendingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription In Progress",
          message: "You already have a subscription request in progress. Please wait a few minutes or contact support if this persists.",
          errorType: "SUBSCRIPTION_IN_PROGRESS",
        },
        { status: 429 }, // Too Many Requests
      )
    }

    // TODO: Implement real referral / promo validation services.
    // For now, accept referral/promo values only if present and sanitize discount bounds.
    if (validatedData.promoDiscount && validatedData.promoDiscount > 100) {
      validatedData.promoDiscount = 100
    }
    if (validatedData.promoDiscount && validatedData.promoDiscount < 0) {
      validatedData.promoDiscount = 0
    }
    // Create or update pending subscription record before redirecting to payment
    try {
      // Clean up any existing pending subscriptions for this user (including old ones)
      await prisma.pendingSubscription.deleteMany({
        where: {
          userId,
          status: "PENDING",
        },
      })

      // Also clean up any old pending subscriptions (older than 1 hour) across all users
      await prisma.pendingSubscription.deleteMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: new Date(Date.now() - 60 * 60 * 1000), // Older than 1 hour
          },
        },
      })

      // Create a new pending subscription record
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
      console.error("Error managing pending subscription record:", error)
      // Continue with checkout even if recording fails
    }

  // Create checkout session (always for non-FREE plans handled by gateway)
    try {
      const stripeGateway = new StripeGateway()
      const result = await stripeGateway.createCheckoutSession(
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
