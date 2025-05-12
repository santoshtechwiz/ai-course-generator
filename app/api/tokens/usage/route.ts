import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    return NextResponse.json({
      used: Number(tokensUsed) || 0,
      received: Number(tokensReceived) || 0,
      remaining: Number(remainingTokens) || 0,
      transactions: tokenTransactions.slice(0, 10), // Return recent transactions for debugging
    })
  } catch (error) {
    console.error("Error fetching token usage:", error)
    return NextResponse.json({ error: "Failed to fetch token usage" }, { status: 500 })
  }
}
