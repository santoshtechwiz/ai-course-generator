import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"
import { NextResponse } from "next/server"
import type { QuizType } from "@/app/types/types"

// Type definitions
export interface QuizAnswer {
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
  let invalidAnswers = false

  if (type === "mcq") {
    invalidAnswers = answers.some(
      (a: any): boolean => typeof a.isCorrect === "undefined" || typeof a.timeSpent === "undefined",
    )
  } else if (type === "openended" || type === "fill-blanks" || type === "code") {
    invalidAnswers = answers.some(
      (a: any): boolean => typeof a.userAnswer === "undefined" ,
    )
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
  try {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Update user quiz record
        const updatedUserQuiz = await tx.userQuiz.update({
          where: { id: Number(submission.quizId) },
          data: {
            timeEnded: new Date(),
            lastAttempted: new Date(),
            bestScore: { set: Math.max(percentageScore, quiz.bestScore ?? 0) },
          },
        })

        // 2. Update user stats
        await tx.user.update({
          where: { id: userId },
          data: {
            totalQuizzesAttempted: { increment: 1 },
            totalTimeSpent: { increment: Math.round(submission.totalTime) },
          },
        })

        // 3. Create or update quiz attempt
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

        // 4. Process individual question answers
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
        maxWait: 5000, // 5 seconds max wait time
        timeout: 10000, // 10 seconds transaction timeout
      },
    )
  } catch (error) {
    console.error("Transaction error:", error)
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
  const questionPromises = questions.map((question, index) => {
    const answer = answers[index]
    const userAnswer = answer.userAnswer
    let isCorrect = false

    if (quizType === "mcq") {
      isCorrect = (answer as QuizAnswer).isCorrect
    }

    return tx.userQuizAttemptQuestion.upsert({
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
  })

  return Promise.all(questionPromises)
}

// Main handler
export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = validateSubmissionData(body)

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error, details: validationResult.details },
        { status: 400 },
      )
    }

    const submission = body as QuizSubmission

    // 3. Validate answer format
    const answerFormatResult = validateAnswersFormat(submission.answers, submission.type)

    if (!answerFormatResult.isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid answer format", details: answerFormatResult.error },
        { status: 400 },
      )
    }

    // 4. Get quiz data
    const quiz = await getQuizWithQuestions(submission.quizId)

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
    }

    // 5. Validate answers count
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

    // 6. Calculate score
    const totalQuestions = quiz.questions ? quiz.questions.length : 0
    const percentageScore = calculatePercentageScore(submission.score, totalQuestions, submission.type)

    // 7. Process submission in transaction
    const result = await processQuizSubmission(userId, submission, quiz, percentageScore)

    // 8. Return success response
    return NextResponse.json({
      success: true,
      result: {
        ...result,
        score: percentageScore,
        totalTime: Math.round(submission.totalTime),
      },
    })
  } catch (error) {
    // Log the full error for debugging
    console.error("Error processing quiz submission:", error)

    // Return a user-friendly error
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

