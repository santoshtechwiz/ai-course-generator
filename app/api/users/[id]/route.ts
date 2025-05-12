import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (await params).id

    // Fetch user with their token transactions
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        TokenTransaction: {
          orderBy: {
            createdAt: "desc",
          },
        },
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (await params).id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user and all related data
    await prisma.$transaction(async (prisma) => {
      // Delete token transactions
      await prisma.tokenTransaction.deleteMany({
        where: {
          userId,
        },
      })

      // Delete quiz attempts
      await prisma.userQuizAttempt.deleteMany({
        where: {
          userId,
        },
      })

      // Delete course progress
      await prisma.courseProgress.deleteMany({
        where: {
          userId,
        },
      })

      // Delete course ratings
      await prisma.courseRating.deleteMany({
        where: {
          userId,
        },
      })

      // Delete subscription
      await prisma.userSubscription.deleteMany({
        where: {
          userId,
        },
      })

      // Delete user
      await prisma.user.delete({
        where: {
          id: userId,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (await params).id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()

    // Update user data
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        userType: body.userType,
        isAdmin: body.isAdmin,
        credits: body.credits,
      },
    })

    // Check if subscription exists before updating
    if (body.userType) {
      const userSubscription = await prisma.userSubscription.findUnique({
        where: { userId },
      })

      if (userSubscription) {
        await prisma.userSubscription.update({
          where: {
            userId,
          },
          data: {
            planId: body.userType,
          },
        })
      }
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
