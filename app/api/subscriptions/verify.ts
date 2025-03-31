import type { NextApiRequest, NextApiResponse } from "next"
import { SubscriptionService } from "@/services/subscriptionService"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription.config"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { sessionId } = req.query

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ message: "Missing session ID" })
  }

  try {
    const result = await SubscriptionService.verifyPaymentStatus(sessionId)

    // If successful, check if we need to update the subscription in our database
    if (result.status === "succeeded" && result.subscription) {
      // Extract metadata from the subscription
      const metadata = result.subscription.metadata || {}
      const userId = metadata.userId
      const planId = metadata.planName

      // Find the plan to get the correct token amount
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

      // Log additional information for debugging
      console.log("Subscription verification successful:", {
        userId,
        planId,
        planTokens: plan?.tokens,
        metadataTokens: metadata.tokens,
      })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error("Error verifying payment:", error)
    return res.status(500).json({ message: "Failed to verify payment", error: String(error) })
  }
}

