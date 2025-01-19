import { NextResponse } from 'next/server'
import { generateOpenEndedQuiz } from '@/lib/chatgpt/quizGenerator'
import { getAuthSession } from '@/lib/authOptions'
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    const { topic, questionCount } = await req.json()
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Generate quiz using OpenAI
    const quiz = await generateOpenEndedQuiz(topic, questionCount, 'medium')
    const slug = generateSlug(topic)

    // Save quiz to database
    const userQuiz = await prisma.userQuiz.create({
      data: {
        userId,
        topic,
        timeStarted: new Date(),
        quizType: 'open-ended',
        slug: slug,
        questions: {
          create: quiz.questions.map((q: { question: string; correct_answer: string; hints: string[]; difficulty: string; tags: string[] }) => ({
            question: q.question,
            answer: q.correct_answer,
            questionType: 'open-ended',
            openEndedQuestion: {
              create: {
                hints: q.hints.join('|'),
                difficulty: q.difficulty,
                tags: q.tags.join('|'),
              },
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            openEndedQuestion: true,
          },
        },
      },
    })

    return NextResponse.json({ quizId: userQuiz.id, slug: userQuiz.slug })
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}

