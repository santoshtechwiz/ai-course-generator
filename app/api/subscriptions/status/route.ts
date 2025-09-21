import { type NextRequest, NextResponse } from "next/server"
import { AuthenticatedApiRoute } from "@/services/base-api-route"
import { z } from "zod"

import { logger } from "@/lib/logger"
import { userRepository } from "@/app/repositories/user.repository"

/**
 * Subscription Status Route Handler
 * Returns the current subscription status for authenticated users
 */
class SubscriptionStatusRoute extends AuthenticatedApiRoute {
  protected schema = z.object({}).strict()

  protected async handle(
    req: NextRequest,
    _data: any,
    { session }: { session: import('next-auth').Session }
  ): Promise<NextResponse> {
    try {
      // Get subscription status using direct database access
      const subscriptionData = await userRepository.getUserSubscriptionData(session.user.id)

      if (!subscriptionData) {
        logger.warn(`No subscription data found for user ${session.user.id}`)
        
        // Return default FREE subscription data
        return this.success({
          credits: 0,
          tokensUsed: 0,
          isSubscribed: false,
          subscriptionPlan: "FREE",
          expirationDate: null,
          status: "INACTIVE",
          cancelAtPeriodEnd: false,
          subscriptionId: "",
          metadata: {
            source: "default_plan"
          }
        })
      }

      const response = {
        credits: subscriptionData.credits || 0,
        tokensUsed: subscriptionData.tokensUsed || 0,
        isSubscribed: subscriptionData.isSubscribed || false,
        subscriptionPlan: subscriptionData.subscriptionPlan || "FREE",
        expirationDate: subscriptionData.expirationDate?.toISOString(),
        status: subscriptionData.status || "INACTIVE",
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
        subscriptionId: subscriptionData.subscriptionId || "",
        metadata: {
          source: "subscription_service",
          lastUpdated: new Date().toISOString()
        }
      }

      return this.success(response)
    } catch (error) {
      logger.error("Error fetching subscription status:", error)
      return this.handleError(error)
    }
  }

}

// Export HTTP method handlers
const subscriptionStatusRoute = new SubscriptionStatusRoute()

export async function GET(req: NextRequest) {
  return subscriptionStatusRoute.process(req)
}
