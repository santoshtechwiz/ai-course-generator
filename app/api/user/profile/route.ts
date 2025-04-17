import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"

export async function GET() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      name: true,
      email: true,
      image: true,
      credits: true,
      userType: true,
      totalCoursesWatched: true,
      totalQuizzesAttempted: true,
      totalTimeSpent: true,
      engagementScore: true,
      streakDays: true,
      lastStreakDate: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { name, email } = await request.json()

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email! },
    data: { name, email },
    select: {
      name: true,
      email: true,
      image: true,
      credits: true,
      userType: true,
      totalCoursesWatched: true,
      totalQuizzesAttempted: true,
      totalTimeSpent: true,
      engagementScore: true,
      streakDays: true,
      lastStreakDate: true,
    },
  })

  return NextResponse.json(updatedUser)
}
