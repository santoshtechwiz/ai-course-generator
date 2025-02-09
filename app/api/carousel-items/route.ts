import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    const [courses, quizzes] = await Promise.all([
      prisma.course.findMany({
      where: { isPublic: true },
      take: 5,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
      }),
      prisma.userQuiz.findMany({
      where: { isPublic: true },
      take: 5,
      select: {
        slug: true,
        id: true,
        topic: true,
        quizType: true,
      },
      })
    ])

    const carouselItems = [
      ...courses.map(course => ({
      id: course.id,
      name: course.name,
      slug: course.slug,
      quizType: 'course',
      description: course.description || `Learn more about ${course.name} in this comprehensive course.`,
      type: 'course' as const,
      })),
      ...quizzes.map(quiz => ({
      id: quiz.id,
      name: quiz.topic,
      slug: quiz.slug,
      description: `Test your knowledge on ${quiz.topic} with this engaging quiz.`,
      quizType: quiz.quizType,
      type: 'quiz' as const,
      })),
    ]

    return NextResponse.json(carouselItems)
  } catch (error) {
    console.error('Error fetching carousel items:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

