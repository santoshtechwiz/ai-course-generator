import prisma from "@/lib/db"
import { NextResponse } from "next/server"


export async function GET() {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count()

    // Get active users (active in the last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Get premium users count
    const premiumUsers = await prisma.user.count({
      where: {
        userType: {
          not: "Free",
        },
      },
    })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      premiumUsers,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}

