import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"
import { NextResponse } from "next/server"
import type { QuizType } from "@/app/types/types"
import { extractUserAnswer } from "@/lib/quiz-result-service"

// Type definitions
export interface QuizAnswer {
  answer: string | string[]
  userAnswer: string | string[]
  isCorrect: boolean
  timeSpent: number
}

export interface BlanksQuizAnswer {
  userAnswer: string
  timeSpent: number
  hintsUsed: boolean
  elapsedTime?: number
}

type QuizAnswerUnion = QuizAnswer | BlanksQuizAnswer

interface QuizSubmission {
  quizId: string
  answers: QuizAnswerUnion[]
  totalTime: number
  score: number
  type: QuizType
}

// Helper functions
function validateSubmissionData(body: any): { isValid: boolean; error?: string; details?: any } {
  if (
    !body.quizId ||
    !Array.isArray(body.answers) ||
    typeof body.totalTime !== "number" ||
    typeof body.score !== "number" ||
    !body.type
  ) {
    return {
      isValid: false,
      error: "Invalid request data",
      details: {
        quizId: !body.quizId ? "Missing quiz ID" : null,
        answers: !Array.isArray(body.answers) ? "Answers must be an array" : null,
        totalTime: typeof body.totalTime !== "number" ? "Total time must be a number" : null,
        score: typeof body.score !== "number" ? "Score must be a number" : null,
        type: !body.type ? "Missing quiz type" : null,
      },
    }
  }

  return { isValid: true }
}

function validateAnswersFormat(answers: QuizAnswerUnion[], type: QuizType): { isValid: boolean; error?: string } {
  if (!Array.isArray(answers) || answers.length === 0) {
    return { isValid: false, error: "Answers must be a non-empty array" }
  }

  let invalidAnswers = false

  switch (type) {
    case "mcq":
    case "code":
      invalidAnswers = answers.some(
        (a: any) => typeof a.isCorrect === "undefined" || typeof a.timeSpent === "undefined",
      )
      break
    case "openended":
    case "fill-blanks":
      invalidAnswers = answers.some(
        (a: any) => typeof a.answer === "undefined" || typeof a.timeSpent === "undefined",
      )
      break
  
    default:
      return { isValid: false, error: `Unsupported quiz type: ${type}` }
  }

  if (invalidAnswers) {
    return {
      isValid: false,
      error: "Answer format doesn't match the quiz type requirements",
    }
  }

  return { isValid: true }
}

function calculatePercentageScore(score: number, totalQuestions: number, type: QuizType): number {
  if (type !== "openended" && type !== "fill-blanks" && type !== "code") {
    return (score / totalQuestions) * 100
  } else {
    return score
  }
}

// Database operations
async function getQuizWithQuestions(quizId: string) {
  return prisma.userQuiz.findUnique({
    where: { id: Number(quizId) },
    include: { questions: true },
  })
}

async function processQuizSubmission(userId: string, submission: QuizSubmission, quiz: any, percentageScore: number) {
  // Move update outside transaction to avoid deadlocks
  const updatedUserQuiz = await prisma.userQuiz.update({
    where: { id: Number(submission.quizId) },
    data: {
      timeEnded: new Date(),
      lastAttempted: new Date(),
      bestScore: { set: Math.max(percentageScore, quiz.bestScore ?? 0) },
    },
  })

  // Continue rest inside transaction
  const result = await prisma.$transaction(
    async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          totalQuizzesAttempted: { increment: 1 },
          totalTimeSpent: { increment: Math.round(submission.totalTime) },
        },
      })

      const quizAttempt = await tx.userQuizAttempt.upsert({
        where: {
          userId_userQuizId: {
            userId,
            userQuizId: Number(submission.quizId),
          },
        },
        update: {
          score: percentageScore,
          timeSpent: Math.round(submission.totalTime),
          accuracy: percentageScore,
        },
        create: {
          userId,
          userQuizId: Number(submission.quizId),
          score: percentageScore,
          timeSpent: Math.round(submission.totalTime),
          accuracy: percentageScore,
        },
      })

      await processQuestionAnswers(tx, quiz.questions, submission.answers, quizAttempt.id, submission.type)

      return {
        updatedUserQuiz,
        quizAttempt,
        percentageScore,
        totalQuestions: quiz.questions ? quiz.questions.length : 0,
      }
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5000,
      timeout: 10000,
    },
  )

  return result
}

async function processQuestionAnswers(
  tx: any,
  questions: any[],
  answers: QuizAnswerUnion[],
  attemptId: number,
  quizType: QuizType,
) {
  const questionPromises = questions.map((question, index) => {
    const answer = answers[index]
    const userAnswer = extractUserAnswer(answer)
    let isCorrect = false

    if (quizType === "mcq") {
      isCorrect = (answer as QuizAnswer).isCorrect
    }

    const txs = tx.userQuizAttemptQuestion.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attemptId,
          questionId: question.id,
        },
      },
      update: {
        userAnswer: Array.isArray(userAnswer) ? userAnswer.join(", ") : userAnswer,
        isCorrect: isCorrect,
        timeSpent: Math.round(answer.timeSpent),
      },
      create: {
        attemptId,
        questionId: question.id,
        userAnswer: Array.isArray(userAnswer) ? userAnswer.join(", ") : userAnswer,
        isCorrect: isCorrect,
        timeSpent: Math.round(answer.timeSpent),
      },
    })

    return txs.catch((error) => {
      console.error("Error in upsert transaction:", error)
      throw error
    })
  })

  return Promise.all(questionPromises)
}

// Optional retry wrapper
async function retryTransaction(fn: () => Promise<any>, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      if (i < retries - 1 && err.code === "P2034") {
        console.warn(`Retrying transaction... (${i + 1})`)
        await new Promise((res) => setTimeout(res, 100 * (i + 1)))
        continue
      }
      throw err
    }
  }
}

// Main handler
export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = validateSubmissionData(body)

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error, details: validationResult.details },
        { status: 400 },
      )
    }

    const submission = body as QuizSubmission
    const answerFormatResult = validateAnswersFormat(submission.answers, submission.type)

    if (!answerFormatResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid answer format", details: answerFormatResult.error },
        { status: 400 },
      )
    }

    const quiz = await getQuizWithQuestions(submission.quizId)

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.questions && submission.answers.length !== quiz.questions.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Answer count mismatch",
          details: `Expected ${quiz.questions.length} answers, got ${submission.answers.length}`,
        },
        { status: 400 },
      )
    }

    const totalQuestions = quiz.questions ? quiz.questions.length : 0
    const percentageScore = calculatePercentageScore(submission.score, totalQuestions, submission.type)

    const result = await retryTransaction(() => processQuizSubmission(userId, submission, quiz, percentageScore))

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        score: percentageScore,
        totalTime: Math.round(submission.totalTime),
      },
    })
  } catch (error) {
    console.error("Error processing quiz submission:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

