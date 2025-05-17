import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"

// Define the missing types
type QuizType = 'mcq' | 'code' | 'openended' | 'blanks' | 'flashcard';

interface QuizAnswer {
  timeSpent: number;
  isCorrect?: boolean;
  answer?: string;
  questionId?: string;
}

interface CodeQuizAnswer {
  timeSpent: number;
  isCorrect?: boolean;
  answer?: string;
  questionId: string;
}

interface BlanksQuizAnswer {
  timeSpent: number;
  userAnswer: string | string[];
  questionId?: string;
}

// Improve the type definitions for quiz answers
export type QuizAnswerUnion = QuizAnswer | BlanksQuizAnswer | CodeQuizAnswer

// Create a properly typed interface for quiz submissions
export interface QuizSubmission {
  quizId: string
  answers: QuizAnswerUnion[]
  totalTime?: number
  timeTaken?: number  // Add this field as it's used in the client
  score?: number
  type: QuizType
  slug?: string      // Add this field as it's used in the client
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

  // Check if required fields exist - adjust to allow for timeTaken instead of totalTime
  const requiredFields = ["quizId", "type", "answers"]
  const missingFields = requiredFields.filter(field => !body[field])

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
      details: { missingFields },
    }
  }

  // Handle both totalTime and timeTaken field names
  if (typeof body.totalTime !== "number" && typeof body.timeTaken !== "number") {
    return {
      isValid: false,
      error: "Either totalTime or timeTaken must be provided as a number",
      details: { 
        totalTime: body.totalTime,
        timeTaken: body.timeTaken
      },
    }
  }
  
  // Normalize the time field
  if (typeof body.timeTaken === "number" && typeof body.totalTime !== "number") {
    body.totalTime = body.timeTaken;
  }
  
  // Handle score field - calculate from answers if not provided
  if (typeof body.score !== "number") {
    // Count correct answers if we can
    if (Array.isArray(body.answers)) {
      body.score = body.answers.filter((a: any) => a.isCorrect === true).length;
    } else {
      body.score = 0;
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
    console.log(`Fetching quiz with ID or slug: ${quizId}`);
    
    // Don't validate as numeric ID - we need to support string slugs
    if (!quizId) {
      console.error("Missing quizId parameter");
      throw new Error("Missing quiz ID");
    }
    
    // Import the database client directly to ensure it's available
    const { prisma } = await import("@/lib/db");
    
    if (!prisma) {
      console.error("Database client is not available");
      throw new Error("Database connection error");
    }

    // First try to find by numeric ID if it looks like a number
    if (!isNaN(Number(quizId))) {
      try {
        const numericId = parseInt(quizId, 10);
        console.log(`Trying to find quiz by numeric ID: ${numericId}`);
        const quizByNumericId = await prisma.userQuiz.findUnique({
          where: { id: numericId },
          include: { questions: true },
        });
        
        if (quizByNumericId) {
          console.log(`Found quiz by numeric ID: ${numericId}`);
          return quizByNumericId;
        }
      } catch (err) {
        console.log(`No quiz found with numeric ID: ${quizId}`);
      }
    }

    // Second check: Try to find by slug in userQuiz model
    try {
      console.log(`Looking for quiz with slug: ${quizId} in userQuiz model`);
      const quizBySlug = await prisma.userQuiz.findFirst({
        where: { slug: quizId },
        include: { questions: true },
      });

      if (quizBySlug) {
        console.log(`Found quiz by slug in userQuiz: ${quizId}`);
        return quizBySlug;
      }
    } catch (err) {
      console.error(`Error finding quiz by slug in userQuiz: ${err}`);
    }
    
    // Third check: Try any other models that might contain quizzes
    // For example, if there's a Quiz model separate from UserQuiz
    try {
      console.log(`Looking for quiz by identifier in other tables: ${quizId}`);
      const quizByIdentifier = await prisma.quizModel.findFirst({
        where: { 
          OR: [
            { slug: quizId },
            { id: quizId }
          ]
        },
        include: { questions: true },
      }).catch(() => null); // Catch error if model doesn't exist

      if (quizByIdentifier) {
        console.log(`Found quiz in alternative model: ${quizId}`);
        return quizByIdentifier;
      }
    } catch (err) {
      // Just log but continue - this model might not exist
      console.log(`No quiz in alternative model or model doesn't exist: ${err.message}`);
    }
    
    // Final attempt: Try direct lookup by slug as a query parameter
    console.log(`Final attempt: Looking in direct slug route parameter: ${quizId}`);
    try {
      const directQuizLookup = await prisma.userQuiz.findFirst({
        where: {
          OR: [
            { slug: { contains: quizId, mode: 'insensitive' } },
            { title: { contains: quizId, mode: 'insensitive' } }
          ] 
        },
        include: { questions: true },
      });
      
      if (directQuizLookup) {
        console.log(`Found quiz by direct lookup: ${quizId}`);
        return directQuizLookup;
      }
    } catch (err) {
      console.error(`Error in final direct lookup: ${err}`);
    }

    // If we get here, we couldn't find the quiz
    console.error(`Quiz not found with ID or slug: ${quizId}`);
    throw new Error(`Quiz not found with identifier: ${quizId}`);
  } catch (error) {
    console.error("Error fetching quiz with questions:", error);
    throw new Error("Failed to fetch quiz data");
  }
}

async function processQuizSubmission(userId: string, submission: QuizSubmission, quiz: any, percentageScore: number) {
  try {
    // Get numeric ID from the quiz object, not from the submission
    // This is critical because submission.quizId might be a slug string
    if (!quiz || typeof quiz.id === 'undefined') {
      console.error("Quiz object is missing ID field");
      throw new Error("Quiz ID missing from quiz object");
    }
    
    const quizId = typeof quiz.id === 'number' ? quiz.id : Number(quiz.id);
    
    if (isNaN(quizId)) {
      console.error("Invalid quiz ID format in quiz object:", quiz.id);
      throw new Error("Invalid quiz ID format");
    }
    
    console.log(`Processing submission for quiz ID: ${quizId} (numeric)`);

    // Move update outside transaction to avoid deadlocks - now using quiz.id instead of submission.quizId
    const updatedUserQuiz = await prisma.userQuiz.update({
      where: { id: quizId }, // Using quiz.id which should now be numeric
      data: {
        quizType: submission.type, // Ensure quiz type is saved
        timeEnded: new Date(),
        lastAttempted: new Date(),
        bestScore: { set: Math.max(percentageScore, quiz.bestScore ?? 0) },
      },
    });

    // Continue rest inside transaction
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            totalQuizzesAttempted: { increment: 1 },
            totalTimeSpent: { increment: Math.round(submission.totalTime || submission.timeTaken || 0) },
          },
        });

        const quizAttempt = await tx.userQuizAttempt.upsert({
          where: {
            userId_userQuizId: {
              userId,
              userQuizId: quizId, // Using quiz.id which should now be numeric
            },
          },
          update: {
            score: percentageScore,
            timeSpent: Math.round(submission.totalTime || submission.timeTaken || 0),
            accuracy: percentageScore,
          },
          create: {
            userId,
            userQuizId: quizId, // Using quiz.id which should now be numeric
            score: percentageScore,
            timeSpent: Math.round(submission.totalTime || submission.timeTaken || 0),
            accuracy: percentageScore,
          },
        });

        await processQuestionAnswers(tx, quiz.questions, submission.answers, quizAttempt.id, submission.type);

        return {
          updatedUserQuiz,
          quizAttempt,
          percentageScore,
          totalQuestions: quiz.questions ? quiz.questions.length : 0,
        };
      },
      {
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return result;
  } catch (error) {
    console.error("Error processing quiz submission:", error);
    throw error;
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
      totalTime: body?.totalTime || body?.timeTaken,
    })

    const validationResult = validateSubmissionData(body)

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error, details: validationResult.details },
        { status: 400 },
      )
    }

    // Convert object to submission type with normalized fields
    const submission: QuizSubmission = {
      quizId: body.quizId,
      answers: body.answers,
      totalTime: body.totalTime || body.timeTaken || 0,
      score: body.score || 0, 
      type: (body.type || 'code').toLowerCase() as QuizType,
      slug: body.slug
    }

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

    let quiz;
    try {
      // Handle both numeric IDs and slug identifiers
      const quizIdentifier = submission.quizId || submission.slug;
      if (!quizIdentifier) {
        return NextResponse.json({ success: false, error: "No quiz identifier provided" }, { status: 400 });
      }
      
      // First try by direct ID/slug in request
      quiz = await getQuizWithQuestions(quizIdentifier);
      
      // If that fails, try with the URL slug parameter
      if (!quiz && request.url) {
        const urlParts = request.url.split('/');
        const urlSlug = urlParts[urlParts.length - 2]; // The slug is the second-to-last part in the URL
        if (urlSlug && urlSlug !== quizIdentifier) {
          quiz = await getQuizWithQuestions(urlSlug);
        }
      }
      
      if (!quiz) {
        return NextResponse.json({ 
          success: false, 
          error: `Quiz not found with ID: ${quizIdentifier}` 
        }, { status: 404 });
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch quiz data" 
      }, { status: 500 });
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
          totalTime: Math.round(submission.totalTime || submission.timeTaken || 0),
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