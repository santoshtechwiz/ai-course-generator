import { getServerSession } from "next-auth/next"
import { type NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user already has a referral code
    const existingReferral = await prisma.userReferral.findUnique({
      where: { userId },
    })

    if (existingReferral) {
      return NextResponse.json({
        referralCode: existingReferral.referralCode,
        message: "Referral code already exists",
      })
    }

    // Generate a unique referral code
    const referralCode = nanoid(8)

    // Create the referral record
    const userReferral = await prisma.userReferral.create({
      data: {
        userId,
        referralCode,
      },
    })

    return NextResponse.json({
      referralCode: userReferral.referralCode,
      message: "Referral code generated successfully",
    })
  } catch (error) {
    console.error("Error generating referral code:", error)
    return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 })
  }
}
