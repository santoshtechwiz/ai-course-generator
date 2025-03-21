import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"


// Get a single user by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (await params).id },
      include: {
        TokenTransaction: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
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

// Update a user
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json()

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: (await params).id },
      data: {
        name: data.name,
        email: data.email,
        credits: data.credits,
        isAdmin: data.isAdmin,
        userType: data.userType,
        updatedAt: new Date(),
      },
    })

    // If credits were changed, create a transaction record
    if (data.previousCredits !== undefined && data.credits !== data.previousCredits) {
      const amount = data.credits - data.previousCredits
      await prisma.tokenTransaction.create({
        data: {
          userId: (await params).id,
          amount,
          type: amount > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          description: data.creditNote || `Admin adjusted credits by ${amount}`,
        },
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// Delete a user
export async function DELETE(request: NextRequest, { params }: { params: Promise< { id: string }> }) {
  try {
    await prisma.user.delete({
      where: { id: (await params).id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

