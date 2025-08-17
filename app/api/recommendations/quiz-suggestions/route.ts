import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const chapterId = searchParams.get("chapterId")

    if (!courseId || !chapterId) {
      return NextResponse.json({ error: "Course ID and Chapter ID are required" }, { status: 400 })
    }

    // Get the current chapter
    const currentChapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      select: {
        id: true,
        title: true,
        course: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    if (!currentChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // Find quizzes related to this course or chapter
    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          // Quizzes specifically for this course
          { courseId: parseInt(courseId) },
          // Quizzes for this specific chapter
          { chapterId: parseInt(chapterId) },
          // General quizzes in the same category
          {
            course: {
              category: currentChapter.course.category,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        questions: {
          select: {
            id: true,
          },
        },
      },
      take: 5,
      orderBy: [
        { createdAt: "desc" },
      ],
    })

    // Transform to match the expected interface
    const transformedQuizzes = quizzes.map((quiz) => {
      const questionCount = quiz.questions.length
      const estimatedTime = Math.max(2, Math.ceil(questionCount * 0.5)) // Estimate 30 seconds per question, minimum 2 minutes
      
      let difficulty: "easy" | "medium" | "hard" = "medium"
      if (questionCount <= 5) difficulty = "easy"
      else if (questionCount >= 15) difficulty = "hard"

      return {
        id: quiz.id.toString(),
        title: quiz.title || `${currentChapter.title} - Quiz`,
        description: quiz.description || "Test your understanding of this chapter",
        estimatedTime,
        difficulty,
      }
    })

    // If no specific quizzes found, create generic suggestions
    if (transformedQuizzes.length === 0) {
      const genericQuizzes = [
        {
          id: `generic-${chapterId}-1`,
          title: `${currentChapter.title} - Quick Review`,
          description: "Test your understanding of the key concepts",
          estimatedTime: 5,
          difficulty: "easy" as const,
        },
        {
          id: `generic-${chapterId}-2`,
          title: `${currentChapter.title} - Deep Dive`,
          description: "Challenge yourself with advanced questions",
          estimatedTime: 10,
          difficulty: "medium" as const,
        },
      ]
      
      return NextResponse.json({
        success: true,
        data: genericQuizzes,
      })
    }

    return NextResponse.json({
      success: true,
      data: transformedQuizzes,
    })
  } catch (error) {
    console.error("Error fetching quiz suggestions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}