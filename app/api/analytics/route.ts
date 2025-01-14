import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const recentQuizzes = await prisma.userQuiz.findMany({
      where: { userId: userId },
      orderBy: { timeStarted: 'desc' },
      take: 5,
      include: { questions: true }
    })

    const recentCourseProgress = await prisma.courseProgress.findMany({
      where: { userId: userId },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
      include: { course: true }
    })

    const notifications = [
      ...recentQuizzes.map(quiz => ({
        id: `quiz-${quiz.id}`,
        message: `You completed the "${quiz.topic}" quiz with a score of ${quiz.score}%`,
        timestamp: quiz.timeEnded || quiz.timeStarted,
        type: 'quiz'
      })),
      ...recentCourseProgress.map(progress => ({
        id: `course-${progress.id}`,
        message: `You made progress in "${progress.course.name}"`,
        timestamp: progress.lastAccessedAt,
        type: 'course'
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return NextResponse.json(notifications.slice(0, 10))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

