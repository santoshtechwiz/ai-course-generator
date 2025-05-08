import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/db"
import { getAuthSession } from "@/lib/auth"


export async function GET() {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const courseProgress = await prisma.courseProgress.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          difficulty: true,
          estimatedHours: true,
        },
      },
    },
  })

  const courses = courseProgress.map((progress) => ({
    id: progress.courseId,
    title: progress.course.title,
    description: progress.course.description,
    image: progress.course.image,
    difficulty: progress.course.difficulty,
    estimatedHours: progress.course.estimatedHours,
    progress: progress.progress,
    isCompleted: progress.isCompleted,
    lastAccessedAt: progress.lastAccessedAt.toISOString(),
  }))

  return NextResponse.json(courses)
}

