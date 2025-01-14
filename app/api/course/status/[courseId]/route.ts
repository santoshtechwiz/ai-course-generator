import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const course = await prisma.course.findUnique({
      where: { id: Number(params.courseId) },
      include: {
        courseUnits: {
          include: {
            chapters: true
          }
        }
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    let totalChapters = 0
    let completedChapters = 0
    let hasError = false

    course.courseUnits.forEach(unit => {
      totalChapters += unit.chapters.length
      completedChapters += unit.chapters.filter(chapter => chapter.videoStatus === 'completed').length
      if (unit.chapters.some(chapter => chapter.videoStatus === 'error')) {
        hasError = true
      }
    })

    const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    let status: 'pending' | 'processing' | 'completed' | 'error' = 'processing'

    if (progress === 0) {
      status = 'pending'
    } else if (progress === 100) {
      status = 'completed'
    } else if (hasError) {
      status = 'error'
    }

    return NextResponse.json({ status, progress })
  } catch (error) {
    console.error("Error fetching course status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

