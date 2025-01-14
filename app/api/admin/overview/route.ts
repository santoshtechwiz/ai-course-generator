import { NextResponse } from "next/server"

import { isAdmin, unauthorized } from "@/lib/auth"
import { prisma } from "@/lib/db"



export async function GET() {
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const [totalUsers, totalCourses, totalQuizzes, activeSubscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.courseQuiz.count(),
      prisma.userSubscription.count({
        where: { status: "active" },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalCourses,
      totalQuizzes,
      activeSubscriptions,
    })
  } catch (error) {
    console.error("Failed to fetch overview stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

