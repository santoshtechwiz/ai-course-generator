import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getAuthSession()
    const userId = session?.user.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = (await props.params);

    if (!slug) {
      return NextResponse.json({ error: 'Quiz slug is required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const quiz = await tx.userQuiz.findFirst({
        where: {
          slug: slug,
          userId: userId,
        },
        include: {
          questions: {
            include: {
              openEndedQuestion: true,
            },
          },
        },
      })

      if (!quiz) {
        return null;
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!user) {
        throw new Error('User not found');
      }

      // const questionCount = quiz.questions.length;
      // const creditDeduction = questionCount > 5 ? 2 : 1;

      // if (user.credits < creditDeduction) {
      //   return { error: 'Insufficient credits', status: 403 };
      // }

      // await tx.user.update({
      //   where: { id: userId },
      //   data: { credits: user.credits - creditDeduction },
      // })

      const transformedQuestions = quiz.questions.map((question) => ({
        id: question.id,
        question: question.question,
        answer: question.answer,
        openEndedQuestion: question.openEndedQuestion ? {
          hints: question.openEndedQuestion.hints.split('|'),
          difficulty: question.openEndedQuestion.difficulty,
          tags: question.openEndedQuestion.tags.split('|'),
        } : null,
      }))

      return {
        id: quiz.id,
        topic: quiz.topic,
        questions: transformedQuestions,
        
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Serialize dates to ISO strings
    const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value instanceof Date
        ? value.toISOString()
        : value
    ))

    return NextResponse.json(serializedResult)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

