import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { QuizSuggestion, QuizSuggestionsResponse } from "@/types/quiz-suggestions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const chapterId = searchParams.get("chapterId")

    if (!courseId || !chapterId) {
      return NextResponse.json({ error: "Course ID and Chapter ID are required" }, { status: 400 })
    }

    // Get the current chapter with its unit and course information
    const currentChapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      select: {
        id: true,
        title: true,
        unit: {
          select: {
            id: true,
            name: true,
            course: {
              select: {
                id: true,
                title: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        courseQuizzes: {
          select: {
            id: true,
            question: true,
            answer: true,
            options: true,
          },
        },
      },
    })

    if (!currentChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // Find course quizzes for this chapter
    const chapterQuizzes = currentChapter.courseQuizzes

    // Find related user quizzes in the same category
    const relatedUserQuizzes = await prisma.userQuiz.findMany({
      where: {
        AND: [
          { isPublic: true },
          {
            OR: [
              // Quizzes with similar titles
              {
                title: {
                  contains: currentChapter.title.split(' ')[0], // Use first word of chapter title
                  mode: 'insensitive',
                },
              },
              // Quizzes in the same category (if course has a category)
              ...(currentChapter.unit.course.category ? [{
                quizType: currentChapter.unit.course.category.name,
              }] : []),
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        quizType: true,
        difficulty: true,
        questions: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      take: 3,
      orderBy: [
        { attempts: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    })

    // Transform chapter quizzes
    const transformedChapterQuizzes = chapterQuizzes.map((quiz, index) => ({
      id: `chapter-${quiz.id}`,
      title: `${currentChapter.title} - Question ${index + 1}`,
      description: quiz.question,
      estimatedTime: 1, // 1 minute per question
      difficulty: "medium" as const,
      type: "chapter-quiz" as const,
    }))

    // Transform user quizzes
    const transformedUserQuizzes = relatedUserQuizzes.map((quiz) => {
      const questionCount = quiz.questions.length
      const estimatedTime = Math.max(2, Math.ceil(questionCount * 0.5)) // Estimate 30 seconds per question, minimum 2 minutes
      
      let difficulty: "easy" | "medium" | "hard" = "medium"
      if (quiz.difficulty) {
        difficulty = quiz.difficulty.toLowerCase() as "easy" | "medium" | "hard"
      } else if (questionCount <= 5) {
        difficulty = "easy"
      } else if (questionCount >= 15) {
        difficulty = "hard"
      }

      return {
        id: `user-${quiz.id}`,
        title: quiz.title,
        description: `Practice quiz with ${questionCount} questions`,
        estimatedTime,
        difficulty,
        type: "user-quiz" as const,
        attemptCount: quiz._count.attempts,
      }
    })

    // Combine and sort suggestions
    const allSuggestions = [
      ...transformedChapterQuizzes,
      ...transformedUserQuizzes,
    ]

    // If no specific quizzes found, create generic suggestions
    if (allSuggestions.length === 0) {
      const genericQuizzes = [
        {
          id: `generic-${chapterId}-1`,
          title: `${currentChapter.title} - Quick Review`,
          description: "Test your understanding of the key concepts",
          estimatedTime: 5,
          difficulty: "easy" as const,
          type: "generic" as const,
        },
        {
          id: `generic-${chapterId}-2`,
          title: `${currentChapter.title} - Deep Dive`,
          description: "Challenge yourself with advanced questions",
          estimatedTime: 10,
          difficulty: "medium" as const,
          type: "generic" as const,
        },
        {
          id: `generic-${chapterId}-3`,
          title: `${currentChapter.title} - Practice Test`,
          description: "Comprehensive assessment of your knowledge",
          estimatedTime: 15,
          difficulty: "hard" as const,
          type: "generic" as const,
        },
      ]
      
      return NextResponse.json({
        success: true,
        data: genericQuizzes,
      })
    }

    return NextResponse.json({
      success: true,
      data: allSuggestions,
    })
  } catch (error) {
    console.error("Error fetching quiz suggestions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}