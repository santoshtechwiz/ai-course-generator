import { getServerSession } from "next-auth/next"
import { type NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's referral code
    const userReferral = await prisma.userReferral.findUnique({
      where: { userId },
    })

    if (!userReferral) {
      return NextResponse.json({
        referralCode: "",
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        tokensEarned: 0,
        recentReferrals: [],
      })
    }

    // Get referral stats
    const referralUses = await prisma.userReferralUse.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const completedReferrals = referralUses.filter((ref) => ref.status === "COMPLETED").length
    const pendingReferrals = referralUses.filter((ref) => ref.status === "PENDING").length

    // Get tokens earned from referrals
    const tokenTransactions = await prisma.tokenTransaction.findMany({
      where: {
        userId,
        type: "REFERRAL",
      },
    })

    const tokensEarned = tokenTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

    // Format recent referrals
    const recentReferrals = referralUses.slice(0, 5).map((ref) => ({
      id: ref.id,
      referredName: ref.referred.name || "Anonymous",
      status: ref.status,
      planId: ref.planId || "N/A",
      date: ref.createdAt.toISOString(),
    }))

    return NextResponse.json({
      referralCode: userReferral.referralCode,
      totalReferrals: referralUses.length,
      completedReferrals,
      pendingReferrals,
      tokensEarned,
      recentReferrals,
    })
  } catch (error) {
    console.error("Error fetching referral stats:", error)
    return NextResponse.json({ error: "Failed to fetch referral stats" }, { status: 500 })
  }
}

