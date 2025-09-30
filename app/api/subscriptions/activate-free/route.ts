/**
 * API Route: POST /api/subscriptions/activate-free
 *
 * Activates the free plan for the authenticated user.
 */

import { NextRequest } from "next/server"
import { ApiResponseHandler } from "@/services/api-response-handler"
import { withAuth } from "@/middlewares/auth-middleware"
import { SubscriptionService } from "@/services/subscription/subscription-service"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    // Parse the request body to check for explicit confirmation
    let body
    try {
      body = await req.json()
    } catch (e) {
      body = {}
    }

    // Require explicit confirmation
    if (!body.confirmed) {
      return ApiResponseHandler.validationError(
        "Explicit confirmation is required to activate the free plan"
      )
    }

    const userId = session.user.id

    // Check if user already has a subscription
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId)

    // If user is already on the free plan, return success without adding tokens again
    if (subscriptionStatus?.isSubscribed && subscriptionStatus?.subscriptionPlan === "FREE") {
      return ApiResponseHandler.success({
        message: "You are already on the free plan",
        alreadySubscribed: true,
      })
    }

    if (subscriptionStatus?.isSubscribed && subscriptionStatus?.subscriptionPlan !== "FREE") {
      return ApiResponseHandler.validationError(
        "You already have an active paid subscription"
      )
    }

    // Activate free plan - create or update subscription and sync user state
    try {
      await prisma.$transaction(async (tx) => {
        // Check if user subscription exists
        const existingSubscription = await tx.userSubscription.findUnique({
          where: { userId }
        })

        const now = new Date()
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

        if (existingSubscription) {
          // Update existing subscription to FREE
          await tx.userSubscription.update({
            where: { userId },
            data: {
              planId: "FREE",
              status: "ACTIVE",
              currentPeriodStart: now,
              currentPeriodEnd: oneYearFromNow,
              cancelAtPeriodEnd: false,
            }
          })
        } else {
          // Create new FREE subscription
          await tx.userSubscription.create({
            data: {
              userId,
              planId: "FREE",
              status: "ACTIVE",
              currentPeriodStart: now,
              currentPeriodEnd: oneYearFromNow,
              cancelAtPeriodEnd: false,
            }
          })
        }

        // Update user state to reflect active free subscription
        await tx.user.update({
          where: { id: userId },
          data: {
            userType: "FREE",
            isActive: true,
            credits: 5, // Give free credits
            creditsUsed: 0, // Reset used credits
          }
        })

        // Create subscription event for tracking
        await tx.subscriptionEvent.create({
          data: {
            userId,
            userSubscriptionId: existingSubscription?.id,
            previousStatus: existingSubscription?.status || null,
            newStatus: "ACTIVE",
            reason: "Free plan activation",
            source: "SYSTEM",
            metadata: {
              planId: "FREE",
              activatedAt: now.toISOString(),
              source: "activate-free-api"
            }
          }
        })

        logger.info(`Free plan activated for user ${userId}`)
      })

      return ApiResponseHandler.success({
        message: "Free plan activated successfully",
        subscriptionPlan: "FREE",
        credits: 5
      })
    } catch (dbError: any) {
      logger.error(`Database error activating free plan for user ${userId}:`, dbError)
      return ApiResponseHandler.error(`Failed to activate free plan: ${dbError.message}`)
    }
  } catch (error: any) {
    logger.error(`Error activating free plan for user ${session.user.id}:`, error)
    return ApiResponseHandler.error(error || "Failed to activate free plan")
  }
}

)
