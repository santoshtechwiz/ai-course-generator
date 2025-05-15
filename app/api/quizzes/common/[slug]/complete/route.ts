import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { QuizType, QuizAnswer, BlanksQuizAnswer, CodeQuizAnswer } from "@/app/types/quiz-types"

// Improve the type definitions for quiz answers
export type QuizAnswerUnion = QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer

// Create a properly typed interface for quiz submissions
export interface QuizSubmission {
  quizId: string
  answers: QuizAnswerUnion[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions?: number
  correctAnswers?: number
  completedAt?: string
}

// Create a typed response interface
export interface QuizCompletionResponse {
  success: boolean
  result?: {
    updatedUserQuiz: any
    quizAttempt: any
    percentageScore: number
    totalQuestions: number
    score: number
    totalTime: number
  }
  error?: string
  details?: any
}

// Helper functions
function validateSubmissionData(body: any): { isValid: boolean; error?: string; details?: any } {
  if (!body) {
    return {
      isValid: false,
      error: "Request body is empty",
    }
  }

  // Check if required fields exist
  const requiredFields = ["quizId", "totalTime", "score", "type"]
  const missingFields = requiredFields.filter((field) => {
    if (field === "totalTime" || field === "score") {
      return typeof body[field] !== "number"
    }
    return !body[field]
  })

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
      details: { missingFields },
    }
  }

  // Special handling for answers array
  if (!body.answers) {
    // If answers is missing but we have totalQuestions, create dummy answers
    if (body.totalQuestions && body.totalQuestions > 0) {
      const avgTimePerQuestion = Math.floor(body.totalTime / body.totalQuestions)
      body.answers = Array(body.totalQuestions).fill({
        isCorrect: false,
        timeSpent: avgTimePerQuestion,
        answer: "",
        userAnswer: "",
      })
    } else {
      return {
        isValid: false,
        error: "Answers array is missing and cannot be created",
        details: { answers: null },
      }
    }
  } else if (!Array.isArray(body.answers)) {
    return {
      isValid: false,
      error: "Answers must be an array",
      details: { answers: typeof body.answers },
    }
  } else if (body.answers.length === 0) {
    // If answers array is empty but we have totalQuestions, create dummy answers
    if (body.totalQuestions && body.totalQuestions > 0) {
      const avgTimePerQuestion = Math.floor(body.totalTime / body.totalQuestions)
      body.answers = Array(body.totalQuestions).fill({
        isCorrect: false,
        timeSpent: avgTimePerQuestion,
        answer: "",
        userAnswer: "",
      })
    } else {
      return {
        isValid: false,
        error: "Answers must be a non-empty array",
        details: { answersLength: 0 },
      }
    }
  }

  return { isValid: true }
}

// Extract user answer from different answer types
function extractUserAnswer(answer: any): string | string[] {
  if (!answer) return ""

  return typeof answer.userAnswer !== "undefined"
    ? answer.userAnswer
    : typeof answer.answer !== "undefined"
      ? answer.answer
      : ""
}

function validateAnswersFormat(
  answers: QuizAnswerUnion[],
  type: QuizType,
): { isValid: boolean; error?: string; details?: any } {
  if (!Array.isArray(answers) || answers.length === 0) {
    return {
      isValid: false,
      error: "Answers must be a non-empty array",
      details: {
        isArray: Array.isArray(answers),
        length: Array.isArray(answers) ? answers.length : 0,
      },
    }
  }

  // Log first answer for debugging
  console.log(`Validating ${type} answer format. First answer:`, JSON.stringify(answers[0], null, 2))

  // For code quizzes, we're more lenient with validation
  if (type === "code") {
    // As long as we have an array with at least one item, we'll accept it
    return { isValid: true }
  }

  let invalidAnswers = false
  let invalidReason = ""

  switch (type) {
    case "mcq":
      invalidAnswers = answers.some((a: any, index) => {
        if (typeof a.isCorrect === "undefined" || typeof a.timeSpent === "undefined") {
          invalidReason = `Answer at index ${index} is missing isCorrect or timeSpent`
          return true
        }
        return false
      })
      break
    case "openended":
      invalidAnswers = answers.some((a: any, index) => {
        if (typeof a.answer === "undefined" || typeof a.timeSpent === "undefined") {
          invalidReason = `Answer at index ${index} is missing answer or timeSpent`
          return true
        }
        return false
      })
      break
    case "blanks":
      invalidAnswers = answers.some((a: any, index) => {
        if (typeof a.userAnswer === "undefined" || typeof a.timeSpent === "undefined") {
          invalidReason = `Answer at index ${index} is missing userAnswer or timeSpent`
          return true
        }
        return false
      })
      break
    case "flashcard":
      // Flashcards might have a different structure
      invalidAnswers = answers.some((a: any, index) => {
        if (typeof a.timeSpent === "undefined") {
          invalidReason = `Answer at index ${index} is missing timeSpent`
          return true
        }
        return false
      })
      break
    default:
      return {
        isValid: false,
        error: `Unsupported quiz type: ${type}`,
        details: { type },
      }
  }

  if (invalidAnswers) {
    return {
      isValid: false,
      error: "Answer format doesn't match the quiz type requirements",
      details: { reason: invalidReason },
    }
  }

  return { isValid: true }
}

// Optimize the calculatePercentageScore function
function calculatePercentageScore(score: number, totalQuestions: number, type: QuizType): number {
  // For open-ended and fill-blanks quizzes, the score is already a percentage
  if (type === "openended" || type === "blanks") {
    // Ensure the score is within 0-100 range
    return Math.min(100, Math.max(0, score))
  }

  // For other quiz types, calculate percentage based on correct answers
  return (score / Math.max(1, totalQuestions)) * 100
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
        quizType: submission.type, // Ensure quiz type is saved
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
    // If no questions or answers, return early
    if (!questions || questions.length === 0 || !answers || answers.length === 0) {
      console.warn("No questions or answers to process")
      return []
    }

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

      // Handle different quiz types
      if (quizType === "mcq") {
        isCorrect = (answer as QuizAnswer).isCorrect === true
      } else if (quizType === "code") {
        // For code quizzes, isCorrect might be undefined or have a different format
        isCorrect = (answer as any).isCorrect === true
      }

      // Convert userAnswer to string, handling arrays and null/undefined values
      const userAnswerString = Array.isArray(userAnswer)
        ? userAnswer.join(", ")
        : userAnswer === null || userAnswer === undefined
          ? ""
          : String(userAnswer)

      // Add additional logging for debugging
      console.log(`Processing answer for question ${question.id}:`, {
        attemptId,
        questionId: question.id,
        userAnswer: userAnswerString,
        isCorrect,
        timeSpent: Math.round(answer.timeSpent || 0),
      })

      return tx.userQuizAttemptQuestion
        .upsert({
          where: {
            attemptId_questionId: {
              attemptId: attemptId,
              questionId: question.id,
            },
          },
          update: {
            userAnswer: userAnswerString.substring(0, 1000), // Limit string length to avoid DB errors
            isCorrect: isCorrect,
            timeSpent: Math.round(answer.timeSpent || 0),
          },
          create: {
            attemptId,
            questionId: question.id,
            userAnswer: userAnswerString.substring(0, 1000), // Limit string length to avoid DB errors
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
async function retryTransaction<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
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
export async function POST(request: Request): Promise<NextResponse<QuizCompletionResponse>> {
  try {
    const session = await getAuthSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
    }

    let body
    try {
      const text = await request.text()
      console.log("Raw request body:", text)

      try {
        body = JSON.parse(text)
      } catch (parseError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON in request body",
            details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
          },
          { status: 400 },
        )
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read request body",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 },
      )
    }

    // Add debug logging
    console.log("Received quiz submission:", {
      quizId: body?.quizId,
      type: body?.type,
      answersCount: body?.answers?.length,
      score: body?.score,
      totalTime: body?.totalTime,
    })

    const validationResult = validateSubmissionData(body)

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error, details: validationResult.details },
        { status: 400 },
      )
    }

    const submission = body as QuizSubmission

    // Normalize the quiz type to handle case differences
    submission.type = submission.type.toLowerCase() as QuizType

    const answerFormatResult = validateAnswersFormat(submission.answers, submission.type)

    if (!answerFormatResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid answer format",
          details: answerFormatResult.details || answerFormatResult.error,
        },
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
