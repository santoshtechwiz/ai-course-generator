import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"
import { NextResponse } from "next/server"
import type { QuizType } from "@/app/types/types"
export interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
}

export interface BlanksQuizAnswer {
  answer: string
  timeSpent: number
  hintsUsed: boolean,
  elapsedTime?: number
}
// Define a union type for different answer structures
type QuizAnswerUnion =
  | QuizAnswer
  | BlanksQuizAnswer
  

export async function POST(request: Request) {
  const session = await getAuthSession()
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (
      !body.quizId ||
      !Array.isArray(body.answers) ||
      typeof body.totalTime !== "number" ||
      typeof body.score !== "number" ||
      !body.type
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: {
            quizId: !body.quizId ? "Missing quiz ID" : null,
            answers: !Array.isArray(body.answers) ? "Answers must be an array" : null,
            totalTime: typeof body.totalTime !== "number" ? "Total time must be a number" : null,
            score: typeof body.score !== "number" ? "Score must be a number" : null,
            type: !body.type ? "Missing quiz type" : null,
          },
        },
        { status: 400 },
      )
    }

    const { quizId, answers, totalTime, score, type } = body as {
      quizId: string
      answers: QuizAnswerUnion[]
      totalTime: number
      score: number
      type: QuizType
    }

    // Validate answers array structure based on quiz type
    let invalidAnswers = false

    if (type === "mcq" ) {
      // For MCQ, validate isCorrect property exists
      invalidAnswers = answers.some(
        (a: any): boolean =>
          typeof a.isCorrect === "undefined" || typeof a.timeSpent === "undefined",
      )
    } else if (type === "openended" || type === "fill-blanks" || type === "code") {
      // For open-ended, fill-blanks, and code quizzes
      invalidAnswers = answers.some(
        (a: any): boolean => typeof a.answer === "undefined" || typeof a.timeSpent === "undefined",
      )
    }

    if (invalidAnswers) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid answer format",
          details: "Answer format doesn't match the quiz type requirements",
        },
        { status: 400 },
      )
    }

    const quiz = await prisma.userQuiz.findUnique({
      where: { id: Number(quizId) },
      include: { questions: true },
    })

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 })
    }

    // Validate answers count matches questions count
    if (quiz.questions && answers.length !== quiz.questions.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Answer count mismatch",
          details: `Expected ${quiz.questions.length} answers, got ${answers.length}`,
        },
        { status: 400 },
      )
    }

    // Calculate percentage score
    let percentageScore: number
    const totalQuestions = quiz.questions ? quiz.questions.length : 0

    if (type !== "openended" && type !== "fill-blanks" && type !== "code") {
      percentageScore = (score / totalQuestions) * 100
    } else {
      percentageScore = score
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const [updatedUserQuiz, , quizAttempt] = await Promise.all([
          tx.userQuiz.update({
            where: { id: Number(quizId) },
            data: {
              timeEnded: new Date(),
              lastAttempted: new Date(),
              bestScore: { set: Math.max(percentageScore, quiz.bestScore ?? 0) },
            },
          }),
          tx.user.update({
            where: { id: userId },
            data: {
              totalQuizzesAttempted: { increment: 1 },
              totalTimeSpent: { increment: Math.round(totalTime) },
            },
          }),
          tx.userQuizAttempt.upsert({
            where: {
              userId_userQuizId: {
                userId,
                userQuizId: Number(quizId),
              },
            },
            update: {
              score: percentageScore,
              timeSpent: Math.round(totalTime),
              accuracy: percentageScore,
            },
            create: {
              userId,
              userQuizId: Number(quizId),
              score: percentageScore,
              timeSpent: Math.round(totalTime),
              accuracy: percentageScore,
            },
          }),
        ])

        const attemptId = quizAttempt.id

        // Process each question answer based on quiz type
        const questionPromises = quiz.questions?.map((question: { id: number }, index: number) => {
          // Default values
          const userAnswer = answers[index].answer
          let isCorrect = false

          // Handle different quiz types
          if (type === "mcq") {
            // For MCQ, we can directly use the isCorrect flag from the client
            isCorrect = (answers[index] as { isCorrect: boolean }).isCorrect
          } else if (type === "openended" || type === "fill-blanks" || type === "code") {
            // For open-ended questions, we don't have a simple isCorrect flag
            // The score is already calculated on the client side
            // We'll set isCorrect to null or false depending on your schema
            isCorrect = false // or null if your schema allows it
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
              timeSpent: Math.round(answers[index].timeSpent),
            },
            create: {
              attemptId,
              questionId: question.id,
              userAnswer: Array.isArray(userAnswer) ? userAnswer.join(", ") : userAnswer,
              isCorrect: isCorrect,
              timeSpent: Math.round(answers[index].timeSpent),
            },
            })
        })

        await Promise.all(questionPromises)

        return {
          updatedUserQuiz,
          quizAttempt,
          percentageScore,
          totalQuestions,
        }
      })

      return NextResponse.json({
        success: true,
        result: {
          ...result,
          score: percentageScore,
          totalTime: Math.round(totalTime),
        },
      })
    } catch (txError) {
      console.error("Transaction error:", txError)
      return NextResponse.json(
        {
          success: false,
          error: "Database transaction failed",
          details: txError instanceof Error ? txError.message : "Unknown transaction error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing quiz:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 },
    )
  }
}

