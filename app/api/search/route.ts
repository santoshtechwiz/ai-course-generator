import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  console.log(query)

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    const games = (await prisma.userQuiz.findMany({
      include: { questions: true },
    })).filter(game =>
      game.questions.some(question =>
        question.question.toLowerCase().includes(query.toLowerCase()) ||
        question.answer.toLowerCase().includes(query.toLowerCase())
      )
    ).map(game => ({ id: game.id, topic: game.topic }))
    
    return NextResponse.json({ courses, games })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'An error occurred while searching' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
