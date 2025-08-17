import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const limit = parseInt(searchParams.get("limit") || "3")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    const userId = session.user.id

    // Get user's completed courses to understand their preferences
    const userProgress = await prisma.userProgress.findMany({
      where: {
        userId: userId,
        isCompleted: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    // Get the current course
    const currentCourse = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      select: {
        id: true,
        title: true,
        category: true,
      },
    })

    if (!currentCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Extract user's preferred categories
    const completedCategories = userProgress.map(p => p.course.category).filter(Boolean)
    const categoryFrequency = completedCategories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get completed course IDs to exclude them
    const completedCourseIds = userProgress.map(p => p.courseId)
    completedCourseIds.push(parseInt(courseId)) // Exclude current course

    // Find personalized recommendations
    const recommendations = await prisma.course.findMany({
      where: {
        AND: [
          { id: { notIn: completedCourseIds } },
          {
            OR: [
              // Prioritize user's preferred categories
              ...(Object.keys(categoryFrequency).length > 0 
                ? [{ category: { in: Object.keys(categoryFrequency) } }]
                : []
              ),
              // Include courses similar to current course
              { category: currentCourse.category },
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
      take: limit * 2, // Get more to allow for filtering
      orderBy: [
        { createdAt: "desc" },
      ],
    })

    // Transform and add match reasons
    const transformedRecommendations = recommendations.slice(0, limit).map((course) => {
      let matchReason = "Recommended for you"
      
      if (categoryFrequency[course.category]) {
        matchReason = `Based on your ${course.category} course history`
      } else if (course.category === currentCourse.category) {
        matchReason = `Similar to ${currentCourse.title}`
      } else {
        matchReason = "Popular among similar learners"
      }

      return {
        id: course.id.toString(),
        title: course.title,
        description: course.description || "",
        image: course.image || undefined,
        slug: course.slug,
        matchReason,
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedRecommendations,
    })
  } catch (error) {
    console.error("Error fetching personalized recommendations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}