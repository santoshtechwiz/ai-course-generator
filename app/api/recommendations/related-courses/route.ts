import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Get the current course to find related courses
    const currentCourse = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    })

    if (!currentCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Find related courses based on category and exclude current course
    const relatedCourses = await prisma.course.findMany({
      where: {
        AND: [
          { id: { not: parseInt(courseId) } },
          { 
            OR: [
              { category: currentCourse.category },
              // Add more sophisticated matching logic here
              {
                title: {
                  contains: currentCourse.title.split(" ")[0],
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        image: true,
        category: true,
      },
      take: limit,
      orderBy: [
        { createdAt: "desc" },
      ],
    })

    // Transform to match the expected interface
    const transformedCourses = relatedCourses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description || "",
      image: course.image || undefined,
    }))

    return NextResponse.json({
      success: true,
      data: transformedCourses,
    })
  } catch (error) {
    console.error("Error fetching related courses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}