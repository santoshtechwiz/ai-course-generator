import { createQuestions, createUserQuiz, prisma, updateTopicCount, updateUserCredits } from "@/lib/db"
import { NextResponse } from "next/server"
import { z } from "zod"


import { getAuthSession } from "@/lib/auth"
import { quizCreationSchema } from "@/schema/schema"
import { generateSlug } from "@/lib/utils"
import NodeCache from "node-cache"
import axios from "axios"
import { QuizType } from "@/types/quiz"

const cache = new NodeCache({ stdTTL: 600 }) // Cache for 10 minutes

export const dynamic = "force-dynamic"

// Create a server-side fetch wrapper
async function fetchQuizQuestions(amount: number, title: string, type: QuizType, difficulty: string, userType: string) {
  // For server-side code, using fetch directly is fine as it doesn't need CSRF/auth handling
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/quiz`,
    {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, title, type, difficulty, userType }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Error fetching quiz questions: ${response.status}`);
  }
  
  return response.json();
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to create a quiz." }, { status: 401 })
    }

    const body = await req.json()
    const { title, type, amount, difficulty, userType } = quizCreationSchema.parse(body)
    const slug = generateSlug(title)
    const quizType: QuizType = type === "open_ended" ? "openended" : "mcq"
    // 1. First fetch questions to ensure we can create a quiz
    const questions = await fetchQuizQuestions(amount, title, quizType, difficulty, userType)
    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions were generated for the given topic." }, { status: 400 })
    }

    // 2. Create the user quiz
    const userQuiz = await createUserQuiz(session.user.id, title, type, slug)

    try {
      // 3. Create questions for the quiz
      await createQuestions(questions, userQuiz.id, quizType)

      // 4. Update topic count
      await updateTopicCount(title)

      // 5. Only deduct credits if everything else succeeded
      await updateUserCredits(session.user.id, quizType)

      return NextResponse.json(
        {
          userQuizId: userQuiz.id,
          slug: userQuiz.slug,
        },
        { status: 200 },
      )
    } catch (error) {
      // If anything fails after quiz creation, try to delete the quiz
      await prisma.userQuiz
        .delete({
          where: { id: userQuiz.id },
        })
        .catch(() => {
          // Ignore deletion errors
          console.error("Failed to cleanup quiz after error:", userQuiz.id)
        })
      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Quiz creation error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to view a quiz." }, { status: 401 })
    }

    const url = new URL(req.url)
    const userQuizId = url.searchParams.get("userQuizId")

    if (!userQuizId) {
      return NextResponse.json({ error: "You must provide a user quiz ID." }, { status: 400 })
    }

    const cacheKey = `userQuiz_${userQuizId}`
    const cachedUserQuiz = cache.get(cacheKey)

    if (cachedUserQuiz) {
      return NextResponse.json({ userQuiz: cachedUserQuiz }, { status: 200 })
    }

    const userQuiz = await prisma.userQuiz.findUnique({
      where: { id: Number(userQuizId) },
      select: {
        slug: true,
        id: true,
        questions: {
          select: {
            id: true,
            question: true,
            answer: true,
            options: true,
            userQuizId: true,
          },
        },
      },
    })

    if (!userQuiz) {
      return NextResponse.json({ error: "User quiz not found." }, { status: 404 })
    }

    const parsedQuestions = userQuiz.questions.map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
    }))

    const userQuizData = { ...userQuiz, questions: parsedQuestions }
    cache.set(cacheKey, userQuizData)

    return NextResponse.json({ userQuiz: userQuizData }, { status: 200 })
  } catch (error) {
    console.error("User quiz retrieval error:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
