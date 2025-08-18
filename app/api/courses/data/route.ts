import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { courseIds } = await request.json()

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json({ error: "Course IDs array is required" }, { status: 400 })
    }

    // Convert string IDs to numbers for Prisma
    const numericCourseIds = courseIds.map(id => parseInt(id)).filter(id => !isNaN(id))

    if (numericCourseIds.length === 0) {
      return NextResponse.json({ data: {} })
    }

    // Fetch course data from database
    const courses = await prisma.course.findMany({
      where: {
        id: {
          in: numericCourseIds
        }
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
      }
    })

    // Convert to the expected format
    const courseData: Record<string, { id: string; slug: string; title: string; description?: string }> = {}
    
    courses.forEach(course => {
      courseData[course.id.toString()] = {
        id: course.id.toString(),
        slug: course.slug || `course-${course.id}`,
        title: course.title,
        description: course.description || undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: courseData
    })
  } catch (error) {
    console.error("Error fetching course data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}