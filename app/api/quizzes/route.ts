import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const quizzes = await prisma.userQuiz.findMany({
      take: 10,
      orderBy: {
        timeStarted: 'desc',
      },
      select: {
        id: true,
        topic: true,
        quizType: true,
        isPublic: true,
        timeStarted: true,
        
        slug: true,
        _count: {
          select: { questions: true },
        },
      },
      where: {
        isPublic: true,
      },
    })

    // Transform the data to include questionCount
    const transformedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      questionCount: quiz._count.questions,
    }))

    // Filter quizzes with questionCount > 0
    const filteredQuizzes = transformedQuizzes.filter(quiz => quiz.questionCount > 0)

    // Shuffle the filtered quizzes array
    const shuffledQuizzes = filteredQuizzes.sort(() => Math.random() - 0.5)

    return NextResponse.json(shuffledQuizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
