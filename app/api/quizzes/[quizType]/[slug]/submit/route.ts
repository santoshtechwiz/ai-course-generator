import { prisma } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { QuizType } from "@/app/types/quiz-types"
import { validateSubscriptionServer } from "@/lib/subscription-validation"

// Simple in-memory cache for quiz data and course associations
// In production, consider using Redis for distributed caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Global cache instances
const quizCache = new SimpleCache();
const courseAssociationCache = new SimpleCache();

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  quizCache.cleanup();
  courseAssociationCache.cleanup();
}, 10 * 60 * 1000);

// Guarded debug logger: only emits in non-production environments
const logDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    // Use console.debug so production consoles that filter info won't show these by default
    // Keep usage minimal to avoid leaking sensitive data
    // eslint-disable-next-line no-console
    console.debug(...(args as any))
  }
}

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

  // Log first answer for debugging (development only)
  logDebug(`Validating ${type} answer format. First answer:`, JSON.stringify(answers[0], null, 2))

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

// Calculate accuracy based on correct answers
function calculateAccuracy(answers: QuizAnswerUnion[], totalQuestions: number): number {
  if (totalQuestions <= 0 || answers.length === 0) return 0
  
  // Count correct answers
  let correctAnswers = 0
  answers.forEach(answer => {
    if ('isCorrect' in answer && answer.isCorrect === true) {
      correctAnswers++
    }
  })
  
  const accuracy = (correctAnswers / totalQuestions) * 100
  return Math.min(100, Math.max(0, Math.round(accuracy)))
}

// Fixed calculatePercentageScore function
function calculatePercentageScore(score: number, totalQuestions: number, type: QuizType): number {
  logDebug(`Calculating percentage score: score=${score}, totalQuestions=${totalQuestions}, type=${type}`)
  
  // Ensure we have valid inputs
  if (totalQuestions <= 0) {
    console.warn('Invalid totalQuestions:', totalQuestions)
    return 0
  }
  
  // For all quiz types, if score represents the number of correct answers,
  // convert to percentage: (correct answers / total questions) * 100
  if (score <= totalQuestions) {
    const percentage = (score / totalQuestions) * 100
    return Math.min(100, Math.max(0, Math.round(percentage)))
  }
  
  // If score is already a percentage (> totalQuestions), cap it at 100
  return Math.min(100, Math.max(0, Math.round(score)))
}

// Separate function to handle course progress updates (outside main transaction)
async function updateCourseProgress(
  userId: string,
  quiz: any,
  totalTime: number,
  percentageScore: number,
  accuracyScore: number,
  submission: QuizSubmission
) {
  try {
  logDebug(`Looking for course association for quiz: ${quiz.id}, slug: ${quiz.slug}`);

    // Check cache first for course association
    const cacheKey = `courseAssociation:${quiz.id}:${quiz.slug}`;
    let courseQuiz = courseAssociationCache.get<any>(cacheKey);

    if (!courseQuiz) {
      // Try to find a course quiz linked to this user quiz
      // The connection between userQuiz and courseQuiz is based on matching content
      // Since there's no direct foreign key relationship, we need to use text matching
      // OPTIMIZATION: Try exact matches first (much faster), then contains
      courseQuiz = await prisma.courseQuiz.findFirst({
        where: {
          OR: [
            // Exact matches first (fastest)
            { question: quiz.slug },
            { answer: quiz.slug },
            { question: String(quiz.id) },
            { answer: String(quiz.id) },
            // Then try contains for partial matches (slower)
            { question: { contains: quiz.slug } },
            { answer: { contains: quiz.slug } }
          ]
        },
        include: {
          chapter: {
            include: {
              unit: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      });

      // Cache the result (longer TTL since course associations don't change often)
      courseAssociationCache.set(cacheKey, courseQuiz || null, 30 * 60 * 1000); // 30 minutes TTL
      logDebug(courseQuiz ? `Cached course association for quiz: ${quiz.id}` : `Cached null association for quiz: ${quiz.id}`);
    } else {
      logDebug(`Cache hit for course association: ${quiz.id}`);
    }
    
    logDebug(courseQuiz ? 
      `Found associated course quiz: ${JSON.stringify({
        chapterId: courseQuiz.chapterId,
        questionId: courseQuiz.id
      })}` : 
      "No associated course quiz found");
    
    if (courseQuiz?.chapter) {
      // Update course progress in a separate transaction
      await prisma.$transaction(async (tx) => {
        const chapter = courseQuiz.chapter;
        const courseId = chapter.unit?.courseId;
        
        if (!courseId) {
          logDebug(`Missing course info for chapter ${chapter.id}`);
          return;
        }
        
          logDebug(`Found associated chapter ${chapter.id} for course ${courseId}`);
        
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
            const chapterProgressData = courseProgress.chapterProgress as any;
            completedChapterIds = chapterProgressData?.completedChapters ? 
              chapterProgressData.completedChapters : [];
          } catch (e) {
            console.warn("Invalid JSON in chapterProgress:", courseProgress.chapterProgress);
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
          
          // Create LearningEvent for quiz completion
          await tx.learningEvent.create({
            data: {
              userId: userId,
              courseId: courseId,
              chapterId: chapter.id,
              type: 'QUIZ_COMPLETED',
              progress: Math.round(percentageScore),
              timeSpent: Math.round(submission.totalTime),
              metadata: {
                quizId: quiz.id,
                quizType: submission.type,
                score: Math.round(percentageScore),
                totalQuestions: quiz.questions.length,
                correctAnswers: Math.round((percentageScore / 100) * quiz.questions.length),
                accuracy: accuracyScore,
                passed: percentageScore >= 70
              }
            }
          });
          
          // Update course progress
          await tx.courseProgress.update({
            where: {
              id: courseProgress.id
            },
            data: {
              chapterProgress: JSON.stringify({
                completedChapters: completedChapterIds,
                lastQuizCompleted: chapter.id,
                quizScore: submission.score
              }),
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
              timeSpent: Math.round(totalTime || 0),
              isCompleted: false
            }
          });
        }
      }, {
        timeout: 8000, // Reduced timeout for async operation
      });
    }
  } catch (error) {
    console.error("Error in updateCourseProgress:", error);
    console.error("Error details:", JSON.stringify({
      quizId: quiz.id,
      quizSlug: quiz.slug,
      userId: userId,
      error: error instanceof Error ? error.message : String(error)
    }));
    throw error; // Re-throw to be caught by the calling function
  }
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
    // Check cache first
    const cacheKey = `quiz:${quizId}`;
    const cachedQuiz = quizCache.get<QuizWithQuestions>(cacheKey);
    if (cachedQuiz) {
      logDebug(`Cache hit for quiz: ${quizId}`);
      return cachedQuiz;
    }

    // Fetch from database
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug: quizId },
      include: { questions: true },
    });

    // Cache the result (shorter TTL for quiz data since it might change)
    if (quiz) {
      quizCache.set(cacheKey, quiz, 2 * 60 * 1000); // 2 minutes TTL
      logDebug(`Cached quiz: ${quizId}`);
    }

    return quiz;
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
  percentageScore: number,
  accuracyScore: number
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

    // Continue with core quiz submission transaction (optimized for speed)
    const result = await prisma.$transaction(
      async (tx) => {
        // Find the quiz by slug to get its numeric ID
        const quizRecord = await tx.userQuiz.findUnique({
          where: { slug: submission.quizId },
          select: { id: true }
        });
        
        if (!quizRecord) {
          throw new Error(`Quiz not found with slug: ${submission.quizId}`);
        }
        
        const quizAttempt = await tx.userQuizAttempt.upsert({
          where: {
            userId_userQuizId: {
              userId,
              userQuizId: quizRecord.id,
            },
          },
          update: {
            score: Math.round(percentageScore),
            timeSpent: Math.round(submission.totalTime),
            accuracy: accuracyScore,
          },
          create: {
            userId,
            userQuizId: quizRecord.id,
            score: Math.round(percentageScore),
            timeSpent: Math.round(submission.totalTime),
            accuracy: accuracyScore,
          },
        })

        await processQuestionAnswersBatch(tx, quiz.questions, submission.answers, quizAttempt.id, submission.type)
        
        return {
          updatedUserQuiz,
          quizAttempt,
          percentageScore,
          totalQuestions: quiz.questions ? quiz.questions.length : 0,
        };
      },
      {
        isolationLevel: "ReadCommitted", // Less restrictive for better performance
        maxWait: 10000, // Increased wait time
        timeout: 20000, // Increased timeout to 20 seconds
      },
    )

    // Handle course progress update asynchronously (fire-and-forget to avoid blocking response)
    // This prevents slow database queries from delaying quiz submission results
    updateCourseProgress(userId, quiz, submission.totalTime, percentageScore, accuracyScore, submission).catch((error) => {
      // Log but don't fail the quiz submission if course progress update fails
      console.error("Error updating course progress (async):", error);
    });

    // Always create a learning event for quiz completion, even for standalone quizzes (fire-and-forget)
    // Capture variables for the async operation
    const eventData = {
      userId: userId,
      type: 'QUIZ_COMPLETED' as const,
      entityId: quiz.id.toString(),
      progress: Math.round(percentageScore),
      timeSpent: Math.round(submission.totalTime),
      metadata: {
        quizId: quiz.id,
        quizSlug: quiz.slug,
        quizType: submission.type,
        score: Math.round(percentageScore),
        totalQuestions: quiz.questions.length,
        correctAnswers: Math.round((percentageScore / 100) * quiz.questions.length),
        accuracy: accuracyScore,
        passed: percentageScore >= 70
      }
    };

    prisma.learningEvent.create({
      data: eventData
    }).catch((error) => {
      // Log but don't fail the quiz submission if learning event creation fails
      console.error("Error creating learning event (async):", error);
    });

    return result;
  } catch (error) {
    console.error("Error processing quiz submission:", error)
    throw error
  }
}

async function processQuestionAnswersBatch(
  tx: any,
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

    // Prepare all question data for batch processing
    const questionData = questions.map((question) => {
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
        return null; // Skip questions without answers
      }

      // Extract user's answer consistently - using type guards to handle union type
      const extractAnswer = (answer: QuizAnswerUnion): string => {
        if ('answer' in answer && answer.answer !== undefined) {
          return typeof answer.answer === 'string' ? answer.answer : String(answer.answer);
        } else if ('userAnswer' in answer && answer.userAnswer !== undefined) {
          return typeof answer.userAnswer === 'string' ? answer.userAnswer : String(answer.userAnswer);
        }
        return '';
      };

      const userAnswer = extractAnswer(answer);

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

      // Ensure question.id is properly converted to a number for the database
      const questionId = typeof question.id === 'string' ? parseInt(question.id, 10) : question.id;

      // Skip if we couldn't convert to a valid number
      if (isNaN(questionId)) {
        console.warn(`Invalid question ID format: ${question.id}, skipping`);
        return null;
      }

      return {
        attemptId,
        questionId: questionId,
        userAnswer: userAnswerString,
        isCorrect,
        timeSpent: Math.round(timeSpent),
      };
    }).filter(Boolean); // Remove null entries

    // Single batch insert for all questions
    if (questionData.length > 0) {
      await tx.userQuizAttemptQuestion.createMany({
        data: questionData,
        skipDuplicates: true, // Handle potential conflicts gracefully
      });

      logDebug(`Batch processed ${questionData.length} questions for attempt ${attemptId}`);
    }

    return questionData;
  } catch (error) {
    console.error("Error in batch question processing:", error)
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
      return NextResponse.json({ 
        success: false, 
        error: "Please sign in to save your quiz results", 
        details: { 
          requiresAuth: true,
          message: "Sign in to save your progress and see detailed results"
        }
      }, { status: 401 })
    }

    // Allow quiz submission for all authenticated users (no subscription/credit requirements for taking quizzes)
    // Quiz creation requires credits, but taking/submitting completed quizzes does not

    let body: Record<string, any>
    try {
      // CRITICAL: Read request body with better error handling
      const text = await request.text()
      
      // Validate that we have a body
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Empty request body",
            details: "No data was sent in the request",
          },
          { status: 400 },
        )
      }

      logDebug("Raw request body length:", text.length)
      logDebug("Raw request body preview:", text.substring(0, 200))

      try {
        // Try to parse JSON with better error handling
        body = JSON.parse(text) as Record<string, any>
        
        // Validate that body is an object
        if (typeof body !== 'object' || body === null) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid request body format",
              details: "Request body must be a JSON object",
            },
            { status: 400 },
          )
        }
        
        logDebug("Parsed body keys:", Object.keys(body))
      } catch (parseError) {
        console.error("JSON parsing error:", parseError)
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON in request body",
            details: {
              message: parseError instanceof Error ? parseError.message : "Unknown parsing error",
              bodyPreview: text.substring(0, 100) + "...",
              suggestion: "Ensure the request body is valid JSON format",
            },
          },
          { status: 400 },
        )
      }
    } catch (error) {
      console.error("Error reading request body:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read request body",
          details: {
            message: error instanceof Error ? error.message : "Unknown error",
            suggestion: "Check network connection and try again",
          },
        },
        { status: 400 },
      )
    }

    // Add debug logging (development only)
    logDebug("Received quiz submission:", {
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

  // Add debug logging for the quizId (development only)
  logDebug("Quiz submission - quizId value:", submission.quizId, "type:", typeof submission.quizId);
    
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
    const accuracyScore = calculateAccuracy(submission.answers, totalQuestions)

    logDebug('Quiz calculation results:', {
      totalQuestions,
      originalScore: submission.score,
      percentageScore,
      accuracyScore,
      quizType: submission.type
    })

    try {
      const result = await retryTransaction(() => processQuizSubmission(userId, submission, quiz, percentageScore, accuracyScore))

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
