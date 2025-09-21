import { NextRequest } from "next/server"
import { withAuth } from "@/middlewares/auth-middleware"
import { ApiResponseHandler } from "@/services/api-response-handler"
import { prisma } from "@/lib/db"

export const GET = withAuth(async (req: NextRequest, session) => {
  try {

    const userId = session.user.id

    // Get the user's current credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    // Get all token transactions for this user
    const tokenTransactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Calculate total tokens received (from subscriptions and purchases)
    const tokensReceived = tokenTransactions
      .filter((tx) => tx.type === "SUBSCRIPTION" || tx.type === "PURCHASE")
      .reduce((sum, tx) => sum + (tx.credits ?? 0), 0)

    // Calculate total tokens used
    const tokensUsed = tokenTransactions
      .filter((tx) => tx.type === "USAGE")
      .reduce((sum, tx) => sum + Math.abs(tx.credits ?? 0), 0)

    // Calculate remaining tokens (should match user.credits)
    const remainingTokens = user?.credits || 0

    return ApiResponseHandler.success({
      used: Number(tokensUsed) || 0,
      received: Number(tokensReceived) || 0,
      remaining: Number(remainingTokens) || 0,
      transactions: tokenTransactions.slice(0, 10), // Return recent transactions for debugging
    })
  } catch (error) {
    return ApiResponseHandler.error(error || "Failed to fetch token usage")
  }
})
