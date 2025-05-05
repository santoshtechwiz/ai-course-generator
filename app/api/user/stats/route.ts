import { NextResponse } from "next/server"

import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/auth"


export async function GET() {
 const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email ?? undefined },
    include: {
      courseProgress: true,
      userQuizzes: true,
      engagementMetrics: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const totalCourses = user.courseProgress.length
  const completedCourses = user.courseProgress.filter((progress) => progress.isCompleted).length
  const totalQuizzes = user.totalQuizzesAttempted
  const averageScore = user.engagementScore

  return NextResponse.json({
    totalCourses,
    completedCourses,
    totalQuizzes,
    averageScore,
    totalCoursesWatched: user.totalCoursesWatched,
    totalTimeSpent: user.totalTimeSpent,
    streakDays: user.streakDays,
    lastStreakDate: user.lastStreakDate,
  })
}

