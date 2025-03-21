import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filter = searchParams.get("filter") || "all"
  const search = searchParams.get("search") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const skip = (page - 1) * limit

  try {
    // Build filter conditions
    const where: any = {}

    // Apply filter
    if (filter === "admin") {
      where.isAdmin = true
    } else if (filter === "premium") {
      where.userType = { not: "Free" }
    }

    // Apply search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        credits: true,
        isAdmin: true,
        userType: true,
        totalCoursesWatched: true,
        totalQuizzesAttempted: true,
        totalTimeSpent: true,
        engagementScore: true,
        streakDays: true,
        lastStreakDate: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        lastActiveAt: true,
      },
      orderBy: { lastActiveAt: "desc" },
      skip,
      take: limit,
    })

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

