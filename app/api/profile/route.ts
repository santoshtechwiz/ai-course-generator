import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        credits: true,
        userType: true,
        isAdmin: true,
        lastLogin: true,
        createdAt: true,
        subscription: {
          select: {
            planId: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...user,
        subscriptionPlan: user.subscription?.planId || null,
        subscriptionStatus: user.subscription?.status || null,
        subscriptionExpirationDate: user.subscription?.currentPeriodEnd || null,
      },
    })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Only allow updating certain fields
    const allowedFields = ["name", "image"]
    const updateData: Record<string, any> = {}

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = data[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
