import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { QuizType } from "@/app/types/quiz-types"

// Define proper types for quiz answers
export interface QuizAnswer {
  questionId: string | number
  isCorrect: boolean
  timeSpent: number
  answer?: any  // Answer can be any type depending on quiz type
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
function validateSubmissionData(body: Record<string, any>): { isValid: boolean; error?: string; details?: unknown } {
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
    const hasValidAnswers = answers.every(a => {
      // Every answer type has timeSpent
      if (typeof a.timeSpent !== 'number') return false;
      
      // Check for answer based on answer type
      if ('answer' in a && typeof a.answer !== 'undefined') return true;
      if ('userAnswer' in a && typeof a.userAnswer !== 'undefined') return true;
      
      return false;
    });
    
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
interface QuizWithQuestions {
  id: number;
  slug: string;
  quizType: string;
  bestScore: number | null;
  questions: Array<{
    id: number;
    answer?: string;
    correctAnswer?: string;
    modelAnswer?: string;
  }>;
}

async function getQuizWithQuestions(quizId: string): Promise<QuizWithQuestions | null> {
  try {
    // Ensure quizId is converted to a Number
    // const numericId = Number(quizId);
    
    // // Validate that it's actually a valid number
    // if (isNaN(numericId)) {
    //   console.error("Invalid quiz ID format:", quizId);
    //   throw new Error(`Invalid quiz ID format: ${quizId}`);
    // }
    
    return await prisma.userQuiz.findUnique({
      where: { slug: quizId },
      include: { questions: true },
    })
  } catch (error) {
    console.error("Error fetching quiz with questions:", error)
    throw new Error("Failed to fetch quiz data")
  }
}

interface QuizSubmissionResult {
  updatedUserQuiz: any;
  quizAttempt: any;
  percentageScore: number;
  totalQuestions: number;
}

async function processQuizSubmission(
  userId: string, 
  submission: QuizSubmission, 
  quiz: QuizWithQuestions, 
  percentageScore: number
): Promise<QuizSubmissionResult> {
  try {
    // Move update outside transaction to avoid deadlocks
    const updatedUserQuiz = await prisma.userQuiz.update({
      where: { slug: submission.quizId },
      data: {
        quizType: submission.type, // Ensure quiz type is saved
        timeEnded: new Date(),
        lastAttempted: new Date(),
        bestScore: { set: Math.max(percentageScore, quiz.bestScore ?? 0) },
        // Remove isCompleted as it's not in the model
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

        // Find the quiz by slug to get its numeric ID
        const quizRecord = await tx.userQuiz.findUnique({
          where: { slug: submission.quizId },
          select: { id: true }
        });
        
        if (!quizRecord) {
          throw new Error(`Quiz not found with slug: ${submission.quizId}`);
        }
        
        // Finding associated chapter will be done in course progress section below
        
        const quizAttempt = await tx.userQuizAttempt.upsert({
          where: {
            userId_userQuizId: {
              userId,
              userQuizId: quizRecord.id,
            },
          },
          update: {
            score: percentageScore,
            timeSpent: Math.round(submission.totalTime),
            accuracy: percentageScore,
          },
          create: {
            userId,
            userQuizId: quizRecord.id,
            score: percentageScore,
            timeSpent: Math.round(submission.totalTime),
            accuracy: percentageScore,
          },
        })

        await processQuestionAnswers(tx, quiz.questions, submission.answers, quizAttempt.id, submission.type)
        
        // Check if this quiz is associated with a course chapter and update course progress
        // Define result first to ensure it's always returned
        const result = {
          updatedUserQuiz,
          quizAttempt,
          percentageScore,
          totalQuestions: quiz.questions ? quiz.questions.length : 0,
        };
        
        try {
          console.log(`Looking for course association for quiz: ${quiz.id}, slug: ${quiz.slug}`);
          
          // Try to find a course quiz linked to this user quiz
          // The connection between userQuiz and courseQuiz is based on matching content
          // Since there's no direct foreign key relationship, we need to use text matching
          let courseQuiz = await tx.courseQuiz.findFirst({
            where: {
              OR: [
                // Try matching by quiz slug in the question or answer field
                { question: { contains: quiz.slug } },
                { answer: { contains: quiz.slug } },
                
                // Try matching by quiz ID (as string) in the question or answer field
                { question: { contains: String(quiz.id) } },
                { answer: { contains: String(quiz.id) } }
              ]
            },
            include: {
              chapter: true
            }
          });
          
          // If course quiz found, get the full chapter info with course details
          if (courseQuiz) {
            const chapterWithCourse = await tx.chapter.findUnique({
              where: { id: courseQuiz.chapterId },
              include: {
                unit: {
                  include: {
                    course: true
                  }
                }
              }
            });
            
            // Enhance courseQuiz with full chapter data
            if (chapterWithCourse) {
              courseQuiz.chapter = chapterWithCourse;
            }
          }
          
          console.log(courseQuiz ? 
            `Found associated course quiz: ${JSON.stringify({
              chapterId: courseQuiz.chapterId,
              questionId: courseQuiz.id
            })}` : 
            "No associated course quiz found");
          
          if (courseQuiz?.chapter) {
            // Update course progress
            const chapter = courseQuiz.chapter;
            
            // Get the unit associated with this chapter
            const unit = await tx.courseUnit.findUnique({
              where: { id: chapter.unitId },
              include: { course: true }
            });
            
            if (!unit || !unit.courseId) {
              console.log(`Missing unit or course info for chapter ${chapter.id}`);
              // Don't return, continue with the result
              return result;
            }
            
            const courseId = unit.courseId;
            
            console.log(`Found associated chapter ${chapter.id} for course ${courseId}`);
            
            // Mark the chapter as completed
            await tx.chapter.update({
              where: { id: chapter.id },
              data: { isCompleted: true }
            });
            
            // Get existing course progress
            const courseProgress = await tx.courseProgress.findFirst({
              where: {
                userId: userId,
                courseId: courseId
              }
            });
            
            if (courseProgress) {
              // Add this chapter to completed chapters if not already there
              let completedChapterIds = [];
              try {
                completedChapterIds = courseProgress.completedChapters ? 
                  JSON.parse(courseProgress.completedChapters) : [];
              } catch (e) {
                console.warn("Invalid JSON in completedChapters:", courseProgress.completedChapters);
                console.error("JSON parse error:", e);
                completedChapterIds = [];
              }
              
              if (!completedChapterIds.includes(chapter.id)) {
                completedChapterIds.push(chapter.id);
              }
              
              // Recalculate progress
              const allChapters = await tx.chapter.findMany({
                where: {
                  unit: {
                    courseId: courseId
                  }
                }
              });
              
              const progress = allChapters.length > 0 ? 
                Math.round((completedChapterIds.length / allChapters.length) * 100) : 0;
              
              // Update course progress
              await tx.courseProgress.update({
                where: {
                  id: courseProgress.id
                },
                data: {
                  completedChapters: JSON.stringify(completedChapterIds),
                  progress: progress,
                  isCompleted: progress === 100, // Mark as completed if 100%
                  completionDate: progress === 100 ? new Date() : courseProgress.completionDate
                }
              });
            } else {
              // Create new course progress if it doesn't exist
              await tx.courseProgress.create({
                data: {
                  userId: userId,
                  courseId: courseId,
                  currentChapterId: chapter.id,
                  completedChapters: JSON.stringify([chapter.id]),
                  progress: 1, // Start with some progress
                  timeSpent: Math.round(submission.totalTime || 0),
                  isCompleted: false
                }
              });
            }
          }
        } catch (error) {
          // Log but don't fail the transaction if course progress update fails
          console.error("Error updating course progress:", error);
          console.error("Error details:", JSON.stringify({
            quizId: quiz.id,
            quizSlug: quiz.slug,
            userId: userId,
            error: error instanceof Error ? error.message : String(error)
          }));
          
          // We need to continue with the result rather than letting the error propagate
          // to ensure the quiz submission is recorded even if course progress update fails
        }

        // Return the predefined result
        return result;
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
  tx: any, // Using 'any' for transaction is necessary due to Prisma's transaction API design
  questions: Array<{ id: string | number; answer?: string; correctAnswer?: string; modelAnswer?: string }>,
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

      // Extract user's answer consistently - using type guards to handle union type
      let userAnswer: string;
      
      // Use a type assertion function to handle the union type
      const extractAnswer = (answer: QuizAnswerUnion): string => {
        if ('answer' in answer && answer.answer !== undefined) {
          return typeof answer.answer === 'string' ? answer.answer : String(answer.answer);
        } else if ('userAnswer' in answer && answer.userAnswer !== undefined) {
          return typeof answer.userAnswer === 'string' ? answer.userAnswer : String(answer.userAnswer);
        }
        return '';
      };
      
      userAnswer = extractAnswer(answer);

      // Determine if answer is correct
      let isCorrect = false;
      
      // Function to check if the isCorrect property exists in answer
      const hasIsCorrectProperty = (answer: QuizAnswerUnion): answer is QuizAnswer => {
        return 'isCorrect' in answer && typeof answer.isCorrect === 'boolean';
      };
      
      if (hasIsCorrectProperty(answer)) {
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
        // Ensure question.id is properly converted to a number for the database
        const questionId = typeof question.id === 'string' ? parseInt(question.id, 10) : question.id;
        
        // Skip if we couldn't convert to a valid number
        if (isNaN(questionId)) {
          console.warn(`Invalid question ID format: ${question.id}, skipping`);
          return Promise.resolve();
        }
        
        return tx.userQuizAttemptQuestion
          .upsert({
            where: {
              attemptId_questionId: {
                attemptId,
                questionId: questionId,
              },
            },
            update: {
              userAnswer: userAnswerString,
              isCorrect,
              timeSpent: Math.round(timeSpent),
            },
            create: {
              attemptId,
              questionId: questionId,
              userAnswer: userAnswerString,
              isCorrect,
              timeSpent: Math.round(timeSpent),
            },
          })
          .catch((error: Error) => {
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

// Optional retry wrapper with improved error handling
async function retryTransaction<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const isPrismaError = 
        typeof err === 'object' && 
        err !== null && 
        ('code' in err || 'name' in err) &&
        (
          (('code' in err) && err.code === 'P2034') ||
          (('name' in err) && err.name === 'PrismaClientKnownRequestError')
        );
        
      if (i < retries - 1 && isPrismaError) {
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

    let body: Record<string, any>
    try {
      const text = await request.text()
      console.log("Raw request body:", text)

      try {
        body = JSON.parse(text) as Record<string, any>
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

      // Ensure all required fields are included in the response
      return NextResponse.json({
        success: true,
        result: {
          ...result,
          score: percentageScore,
          totalTime: Math.round(submission.totalTime),
        },
      })
    } catch (processingError: unknown) {
      console.error("Error in quiz submission processing:", processingError)
      
      // Handle errors with better context
      const errorMessage = 
        processingError instanceof Error 
          ? processingError.message 
          : "Error processing submission";
          
      const errorDetails = 
        processingError instanceof Error && processingError.stack
          ? { stack: processingError.stack }
          : undefined;
          
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorDetails
        },
        { status: 500 },
      )
    }
  } catch (error: unknown) {
    console.error("Error processing quiz submission:", error)

    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        // Only include stack trace in development environment
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      },
      { status: 500 },
    )
  }
}
