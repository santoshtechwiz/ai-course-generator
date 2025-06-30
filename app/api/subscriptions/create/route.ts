import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"

// Define validation schema for request body with improved type checking
const subscriptionSchema = z.object({
  planId: z.enum(["FREE", "BASIC", "PRO", "ULTIMATE"]),
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
      })
    } catch (checkoutError: any) {
      console.error("Error creating checkout session:", checkoutError)

      return NextResponse.json(
        {
          success: false,
          error: "Checkout Error",
          message: checkoutError.message || "Failed to create checkout session",
          errorType: "CHECKOUT_ERROR",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error creating subscription:", error)

    if (error.message === "User already has an active subscription") {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription conflict",
          message: "You already have an active subscription",
          details: error.message,
          errorType: "ALREADY_SUBSCRIBED",
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create subscription",
        message: "An error occurred while creating your subscription",
        details: error.message,
        errorType: "SERVER_ERROR",
      },
      { status: 500 },
    )
  }
}
