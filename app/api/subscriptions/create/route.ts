import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { SubscriptionService } from "@/services/subscriptionService"
import { z } from "zod"
import prisma from "@/lib/db"


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to create a subscription" },
        { status: 401 },
      )
    }

    const body = await req.json()

    const schema = z.object({
      userId: z.string(),
      planName: z.string(),
      duration: z.number().int().positive(),
      referralCode: z.string().optional(),
      promoCode: z.string().optional(),
      promoDiscount: z.number().optional(),
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

    // Verify the user is authorized to create a subscription for this userId
    if (session.user.id !== validatedData.userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You are not authorized to create a subscription for this user",
        },
        { status: 403 },
      )
    }

    // Check if referral code is valid if provided
    if (validatedData.referralCode) {
      const isValidReferral = await SubscriptionService.validateReferralCode(validatedData.referralCode)
      if (!isValidReferral) {
        return NextResponse.json(
          {
            error: "Invalid Referral",
            message: "The provided referral code is invalid or expired",
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
            error: "Invalid Promo Code",
            message: "The provided promo code is invalid or expired",
          },
          { status: 400 },
        )
      }

      // Use the validated discount percentage from the service
      validatedData.promoDiscount = promoValidation.discountPercentage
    }

    // Create a pending subscription record before redirecting to Stripe
    // This helps track that a subscription attempt was started but not completed
    try {
      await prisma.pendingSubscription.create({
        data: {
          userId: validatedData.userId,
          planId: validatedData.planName,
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

    // Now we can pass the promo code and discount to the updated service method
    const result = await SubscriptionService.createCheckoutSession(
      validatedData.userId,
      validatedData.planName,
      validatedData.duration,
      validatedData.referralCode,
      validatedData.promoCode,
      validatedData.promoDiscount,
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error creating subscription:", error)

    if (error.message === "User already has an active subscription") {
      return NextResponse.json(
        {
          error: "Subscription conflict",
          message: "You already have an active subscription",
          details: error.message,
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create subscription",
        message: "An error occurred while creating your subscription",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

