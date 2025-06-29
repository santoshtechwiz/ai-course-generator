import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { QuizType } from "@/app/types/quiz-types"

// Define proper types for quiz answers
export interface QuizAnswer {
  questionId: string | number
  isCorrect: boolean
  timeSpent: number
  answer?: string
}

export interface BlanksQuizAnswer {
  questionId: string | number
  userAnswer: string | string[]
  timeSpent: number
  isCorrect?: boolean
}

export interface CodeQuizAnswer {
  questionId: string | number
  answer: string
  timeSpent: number
  isCorrect?: boolean
}

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

  // For code and MCQ quizzes, we're more lenient with validation
  if (type === "code" || type === "mcq") {
    // As long as we have an array with at least one item with timeSpent and answer, we'll accept it
    const hasValidAnswers = answers.every(a => 
      typeof a.timeSpent === 'number' && 
      (typeof a.answer !== 'undefined' || typeof a.userAnswer !== 'undefined')
    );
    
    if (hasValidAnswers) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: `Answer format for ${type} quiz is invalid - missing required fields`,
        details: { 
          required: "Each answer needs timeSpent and answer fields",
          exampleFormat: { questionId: "id", timeSpent: 123, answer: "value" }
        }
      };
    }
  }

  let invalidAnswers = false
  let invalidReason = ""

  switch (type) {
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
  // For open-ended and blanks quizzes, the score is already a percentage
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
    // Ensure quizId is converted to a Number
    const numericId = Number(quizId);
    
    // Validate that it's actually a valid number
    if (isNaN(numericId)) {
      console.error("Invalid quiz ID format:", quizId);
      throw new Error(`Invalid quiz ID format: ${quizId}`);
    }
    
    return await prisma.userQuiz.findUnique({
      where: { id: numericId },
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
    // If no questions or answers, return early with warning
    if (!questions || questions.length === 0 || !answers || answers.length === 0) {
      console.warn("No questions or answers to process")
      return []
    }

    // Map answers to questions, handling the case when question count and answer count differ
    const questionPromises = questions.map((question, index) => {
      // Find matching answer for this question
      const answer = answers.find(a => {
        // Handle both string and number question IDs
        if (typeof a.questionId === typeof question.id) {
          return a.questionId === question.id;
        } else if (typeof a.questionId === 'string' && typeof question.id === 'number') {
          return a.questionId === String(question.id);
        } else if (typeof a.questionId === 'number' && typeof question.id === 'string') {
          try {
            return a.questionId === parseInt(question.id);
          } catch (e) {
            return false;
          }
        }
        return false;
      });
      
      if (!answer) {
        console.warn(`No answer found for question ID ${question.id}`);
        return Promise.resolve(); // Skip questions without answers
      }

      // Extract user's answer consistently
      let userAnswer: string;
      if (typeof answer.answer === 'string') {
        userAnswer = answer.answer;
      } else if (typeof answer.userAnswer === 'string') {
        userAnswer = answer.userAnswer;
      } else if (answer.answer !== undefined) {
        userAnswer = String(answer.answer);
      } else if (answer.userAnswer !== undefined) {
        userAnswer = String(answer.userAnswer);
      } else {
        userAnswer = '';
      }

      // Determine if answer is correct
      let isCorrect = false;
      if (typeof answer.isCorrect === 'boolean') {
        // Trust client-side judgment if provided
        isCorrect = answer.isCorrect;
      } else {
        // Determine correctness based on quiz type
        switch (quizType) {
          case 'mcq':
          case 'code':
            // For multiple choice, simple string comparison
            const correctAnswer = question.answer || question.correctAnswer;
            isCorrect = correctAnswer === userAnswer;
            break;
            
          case 'openended':
            // For open-ended, we'd ideally do more sophisticated matching
            // This is simplified for now - in reality would use better comparison
            const modelAnswer = question.answer || question.correctAnswer || question.modelAnswer;
            if (modelAnswer && userAnswer) {
              isCorrect = userAnswer.toLowerCase().includes(modelAnswer.toLowerCase()) || 
                          modelAnswer.toLowerCase().includes(userAnswer.toLowerCase());
            }
            break;
            
          case 'blanks':
            // For blanks, exact match expected
            const expectedAnswer = question.answer || question.correctAnswer;
            isCorrect = expectedAnswer === userAnswer;
            break;
            
          default:
            isCorrect = false;
        }
      }

      // Ensure userAnswer is a string and not too long
      const userAnswerString = typeof userAnswer === 'string' ? 
          userAnswer.substring(0, 1000) : // Limit length
          String(userAnswer).substring(0, 1000); // Convert to string and limit length

      const timeSpent = parseInt(String(answer.timeSpent), 10) || 0;
      
      try {
        // Use a unified structure for storing all quiz types
        return tx.userQuizAttemptQuestion
          .upsert({
            where: {
              attemptId_questionId: {
                attemptId,
                questionId: question.id,
              },
            },
            update: {
              userAnswer: userAnswerString,
              isCorrect,
              timeSpent: Math.round(timeSpent),
            },
            create: {
              attemptId,
              questionId: question.id,
              userAnswer: userAnswerString,
              isCorrect,
              timeSpent: Math.round(timeSpent),
            },
          })
          .catch((error) => {
            console.error("Database upsert error:", error, {
              attemptId,
              questionId: question.id,
              userAnswer: userAnswerString,
              timeSpent,
            });
            // Continue with other questions despite this error
            return Promise.resolve();
          });
      } catch (error) {
        console.error("Error processing question:", error, { questionId: question.id });
        // Continue with other questions despite this error
        return Promise.resolve();
      }
    });

    // Continue even if some questions fail
    const results = await Promise.allSettled(questionPromises);
    console.log(`Processed ${results.length} questions, ${results.filter(r => r.status === 'fulfilled').length} successful`);
    
    return results;
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
    submission.type = (submission.type || "mcq").toLowerCase() as QuizType

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

    // Add debug logging for the quizId
    console.log("Quiz submission - quizId value:", submission.quizId, "type:", typeof submission.quizId);
    
    // Attempt to get the quiz, with better error handling for invalid IDs
    let quiz;
    try {
      quiz = await getQuizWithQuestions(submission.quizId);
    } catch (error) {
      console.error("Error getting quiz with questions:", error);
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch quiz data",
        details: { quizId: submission.quizId, type: typeof submission.quizId } 
      }, { status: 400 });
    }

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
