import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"
import { NextResponse } from "next/server"
import type { QuizType } from "@/app/types/types"

// Type definitions
export interface QuizAnswer {
  answer: string | string[]
  userAnswer?: string | string[]
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
  if (!body) {
    return {
      isValid: false,
      error: "Request body is empty",
    }
  }

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

// Extract user answer from different answer types
function extractUserAnswer(answer: any): string | string[] {
  if (!answer) return ""

  if (typeof answer.userAnswer !== "undefined") {
    return answer.userAnswer
  } else if (typeof answer.answer !== "undefined") {
    return answer.answer
  }
  return ""
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
      invalidAnswers = answers.some((a: any) => typeof a.answer === "undefined" || typeof a.timeSpent === "undefined")
      break

    case "fill-blanks":
      invalidAnswers = answers.some(
        (a: any) => typeof a.userAnswer === "undefined" || typeof a.timeSpent === "undefined",
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
  // For open-ended and fill-blanks quizzes, the score is already a percentage
  if (type === "openended" || type === "fill-blanks") {
    // Ensure the score is within 0-100 range
    return Math.min(100, Math.max(0, score))
  }
  // For other quiz types, calculate percentage based on correct answers
  else {
    return (score / Math.max(1, totalQuestions)) * 100
  }
}

// Database operations
async function getQuizWithQuestions(quizId: string) {
  try {
    return await prisma.userQuiz.findUnique({
      where: { id: Number(quizId) },
      include: { questions: true },
    })
  } catch (error) {
    console.error("Error fetching quiz with questions:", error)
    throw new Error("Failed to fetch quiz data")
  }
}

async function processQuizSubmission(userId: string, submission: QuizSubmission, quiz: any, percentageScore: number) {
  try {
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
  } catch (error) {
    console.error("Error processing quiz submission:", error)
    throw error
  }
}

async function processQuestionAnswers(
  tx: any,
  questions: any[],
  answers: QuizAnswerUnion[],
  attemptId: number,
  quizType: QuizType,
) {
  try {
    const questionPromises = questions.map((question, index) => {
      if (index >= answers.length) {
        console.warn(`Answer missing for question at index ${index}`)
        return Promise.resolve() // Skip this question if no answer
      }

      const answer = answers[index]
      if (!answer) {
        console.warn(`Null or undefined answer at index ${index}`)
        return Promise.resolve() // Skip this question if answer is null/undefined
      }

      const userAnswer = extractUserAnswer(answer)
      let isCorrect = false

      if (quizType === "mcq" || quizType === "code") {
        isCorrect = (answer as any).isCorrect === true
      }

      const userAnswerString = Array.isArray(userAnswer) ? userAnswer.join(", ") : String(userAnswer || "")

      return tx.userQuizAttemptQuestion
        .upsert({
          where: {
            attemptId_questionId: {
              attemptId: attemptId,
              questionId: question.id,
            },
          },
          update: {
            userAnswer: userAnswerString,
            isCorrect: isCorrect,
            timeSpent: Math.round(answer.timeSpent || 0),
          },
          create: {
            attemptId,
            questionId: question.id,
            userAnswer: userAnswerString,
            isCorrect: isCorrect,
            timeSpent: Math.round(answer.timeSpent || 0),
          },
        })
        .catch((error) => {
          console.error("Error in upsert transaction:", error, {
            attemptId,
            questionId: question.id,
            userAnswer: userAnswerString,
            timeSpent: answer.timeSpent,
          })
          throw error
        })
    })

    return Promise.all(questionPromises)
  } catch (error) {
    console.error("Error processing question answers:", error)
    throw error
  }
}

// Optional retry wrapper
async function retryTransaction(fn: () => Promise<any>, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      if (i < retries - 1 && (err.code === "P2034" || err.name === "PrismaClientKnownRequestError")) {
        console.warn(`Retrying transaction... (${i + 1})`)
        await new Promise((res) => setTimeout(res, 100 * (i + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error("Maximum retries exceeded")
}

// Main handler
export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

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

    // Handle case where answer count doesn't match question count
    if (quiz.questions && submission.answers.length !== quiz.questions.length) {
      console.warn(`Answer count mismatch: Expected ${quiz.questions.length}, got ${submission.answers.length}`)
      // Continue with available answers instead of failing
    }

    const totalQuestions = quiz.questions ? quiz.questions.length : 0
    const percentageScore = calculatePercentageScore(submission.score, totalQuestions, submission.type)

    try {
      const result = await retryTransaction(() => processQuizSubmission(userId, submission, quiz, percentageScore))

      return NextResponse.json({
        success: true,
        result: {
          ...result,
          score: percentageScore,
          totalTime: Math.round(submission.totalTime),
        },
      })
    } catch (processingError) {
      console.error("Error in quiz submission processing:", processingError)
      return NextResponse.json(
        {
          success: false,
          error: processingError instanceof Error ? processingError.message : "Error processing submission",
        },
        { status: 500 },
      )
    }
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
