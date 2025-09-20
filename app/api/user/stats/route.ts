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
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const totalCourses = user.courseProgress.length
  const completedCourses = user.courseProgress.filter((progress) => progress.isCompleted).length

  // Compute quiz counts and average score from attempts
  const totalQuizzes = await prisma.userQuizAttempt.count({ where: { userId: user.id } })
  const avgScoreAggregate = await prisma.userQuizAttempt.aggregate({
    _avg: { score: true },
    where: { userId: user.id },
  })
  const averageScore = Math.round((avgScoreAggregate._avg.score || 0) as number)

  // Compute totalCoursesWatched via courseProgress timeSpent
  const totalCoursesWatched = await prisma.courseProgress.count({ where: { userId: user.id, timeSpent: { gt: 0 } } })

  const totalTimeSpent = user.totalTimeSpent || 0
  const streakDays = user.streakDays || 0
  const lastStreakDate = user.lastStreakDate || null

  return NextResponse.json({
    totalCourses,
    completedCourses,
    totalQuizzes,
    averageScore,
    totalCoursesWatched,
    totalTimeSpent,
    streakDays,
    lastStreakDate,
  })
}
