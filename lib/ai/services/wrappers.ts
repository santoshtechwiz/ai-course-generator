/**
 * AI Service Wrappers - Backward Compatibility Layer
 * 
 * These wrapper functions maintain the original function signatures
 * while using the new subscription-aware service architecture internally.
 * 
 * Warning: These are compatibility wrappers. For new code, use AIServiceFactory directly.
 */

import type { FlashCard, Quiz } from "@/app/types/types"
import type { Question } from "@/app/types/result-types"
import type { Session } from 'next-auth'
// import { AIServiceFactory } from '@/lib/ai/services/AIServiceFactory' // Moved to dynamic import
// import { createContextFromSession, createContext } from './context-helper' // Moved to dynamic import
import type { BasicAIService } from './BasicAIService'
import type { PremiumAIService } from './PremiumAIService'

// ============= Types =============

/**
 * Ordering quiz question type
 */
interface OrderingQuizQuestion {
  id: string | number
  title: string
  topic: string
  steps: Array<{
    id: number
    description: string
    explanation?: string
  }>
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  type?: 'ordering'
  correctOrder?: number[]
}

// ============= Flashcard Generation =============

/**
 * Generate flashcards from a given topic
 * 
 * @param topic - The topic or subject to generate flashcards for
 * @param count - Number of flashcards to generate (default: 5)
 * @param session - Optional user session for subscription checking
 * @returns Array of flashcards with questions and answers
 * 
 * @example
 * const cards = await generateFlashcardsFromTopic("React Hooks", 10, session)
 */
export async function generateFlashcardsFromTopic(
  topic: string,
  count: number = 5,
  session?: Session | null
): Promise<FlashCard[]> {
  try {
    const { createContextFromSession, createContext } = await import('./context-helper')
    const { AIServiceFactory } = await import('@/lib/ai/services/AIServiceFactory')
    
    const context = session 
      ? createContextFromSession(session)
      : createContext(undefined, 'FREE', false, 0)

    const service = AIServiceFactory.createService(context) as BasicAIService
    
    const result = await service.generateFlashcards({
      topic,
      count,
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate flashcards')
    }

    // Transform to legacy FlashCard format
    return result.data.map((card: any, index: number) => ({
      id: index + 1,
      question: card.question,
      answer: card.answer,
    }))
  } catch (error) {
    console.error('Failed to generate flashcards:', error)
    throw new Error(`Error generating flashcards: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ============= Ordering Quiz Generation =============

/**
 * Generate an ordering/sequencing quiz from a topic
 * 
 * @param topic - The technical topic for the quiz
 * @param numberOfSteps - Number of steps (4-7 recommended)
 * @param userPlan - User's subscription plan
 * @param session - Optional user session
 * @returns Ordering quiz question with shuffled steps
 * 
 * @example
 * const quiz = await generateOrderingFromTopic("Git Workflow", 5, "PREMIUM", session)
 */
export async function generateOrderingFromTopic(
  topic: string,
  numberOfSteps: number = 5,
  userPlan: 'FREE' | 'PREMIUM' | 'PRO' = 'FREE',
  session?: Session | null
): Promise<OrderingQuizQuestion> {
  try {
    const context = session
      ? createContextFromSession(session)
      : createContext(undefined, userPlan, false, 0)

    const service = AIServiceFactory.createService(context) as BasicAIService
    
    const result = await service.generateOrderingQuiz({
      topic,
      numberOfSteps,
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate ordering quiz')
    }

    // Parse and transform the result to match legacy format
    const quizData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data

    const steps = quizData.steps.map((step: any, index: number) => ({
      id: index,
      description: step.description,
      explanation: step.explanation || '',
    }))

    const correctOrder = steps.map((_: any, index: number) => index)
    
    // Shuffle steps for UI (Fisher-Yates shuffle)
    const shuffledSteps = [...steps]
    for (let i = shuffledSteps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledSteps[i], shuffledSteps[j]] = [shuffledSteps[j], shuffledSteps[i]]
    }

    return {
      id: Date.now(),
      title: quizData.title,
      topic,
      description: quizData.description,
      steps: shuffledSteps,
      correctOrder,
      difficulty: quizData.difficulty || 'medium',
      type: 'ordering',
    }
  } catch (error) {
    console.error('Failed to generate ordering quiz:', error)
    throw new Error(`Error generating ordering quiz: ${error instanceof Error ? error.message : String(error)}`)
  }
}


/**
 * Check quiz generation limits based on plan and daily usage
 * 
 * @param userPlan - User's subscription plan
 * @param quizzesGeneratedToday - Number of quizzes generated today
 * @returns Access check result with canGenerate flag and limits
 * 
 * @example
 * const access = checkQuizGenerationLimit('PREMIUM', 5)
 */
export function checkQuizGenerationLimit(
  userPlan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | 'PRO' = 'FREE',
  quizzesGeneratedToday: number = 0
): { canGenerate: boolean; reason?: string; limitPerDay: number } {
  const normalizedPlan = userPlan === 'PRO' ? 'ENTERPRISE' : userPlan
  
  const limits = {
    'FREE': 2,
    'BASIC': 5,
    'PREMIUM': 10,
    'ENTERPRISE': 50,
  }

  const limitPerDay = limits[normalizedPlan]

  if (quizzesGeneratedToday >= limitPerDay) {
    return {
      canGenerate: false,
      reason: `You have reached your daily limit of ${limitPerDay} quizzes for the ${userPlan} plan.`,
      limitPerDay,
    }
  }

  return {
    canGenerate: true,
    limitPerDay,
  }
}

// ============= MCQ Quiz Generation =============

/**
 * Generate multiple choice questions from a topic
 * 
 * @param topic - The topic to generate questions about
 * @param amount - Number of questions to generate
 * @param difficulty - Difficulty level
 * @param userType - User's subscription type
 * @param session - Optional user session
 * @returns Array of MCQ questions
 * 
 * @example
 * const questions = await generateMCQFromTopic("JavaScript", 10, "hard", "PREMIUM", session)
 */
export async function generateMCQFromTopic(
  topic: string,
  amount: number,
  difficulty: string = 'hard',
  userType: string = 'FREE',
  session?: Session | null
): Promise<Question[]> {
  try {
    const context = session
      ? createContextFromSession(session)
      : createContext(undefined, userType, false, 0)

    const service = AIServiceFactory.createService(context) as BasicAIService | PremiumAIService
    
    const result = await service.generateMultipleChoiceQuiz({
      topic,
      numberOfQuestions: amount,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate MCQ quiz')
    }

    // Parse result if it's a string
    const questions = typeof result.data === 'string' ? JSON.parse(result.data) : result.data

    // Transform to legacy Question format
    return Array.isArray(questions) ? questions : questions.questions || []
  } catch (error) {
    console.error('Error generating MCQ quiz:', error)
    throw new Error(`Failed to generate MCQ quiz: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ============= Open-Ended Quiz Generation =============

/**
 * Generate open-ended questions from a topic
 * 
 * @param topic - The topic to generate questions about
 * @param amount - Number of questions to generate
 * @param difficulty - Difficulty level
 * @param userType - User's subscription type
 * @param session - Optional user session
 * @returns Quiz with open-ended questions
 * 
 * @example
 * const quiz = await generateOpenEndedFromTopic("Machine Learning", 5, "medium", "PREMIUM", session)
 */
export async function generateOpenEndedFromTopic(
  topic: string,
  amount: number = 5,
  difficulty: string = 'medium',
  userType: string = 'FREE',
  session?: Session | null
): Promise<Quiz> {
  try {
    const context = session
      ? createContextFromSession(session)
      : createContext(undefined, userType, false, 0)

    const service = AIServiceFactory.createService(context)
    
    // Check if service has generateOpenEndedQuestionsQuiz method (Premium only)
    if (!('generateOpenEndedQuestionsQuiz' in service)) {
      throw new Error('Open-ended quizzes require a PREMIUM or ENTERPRISE subscription')
    }

    const result = await (service as any).generateOpenEndedQuestionsQuiz({
      topic,
      numberOfQuestions: amount,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate open-ended quiz')
    }

    // Parse and return quiz data
    const quizData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
    
    return {
      id: Date.now().toString(),
      title: topic,
      questions: quizData.questions || quizData,
    }
  } catch (error) {
    console.error('Error generating open-ended quiz:', error)
    throw new Error(`Failed to generate open-ended quiz: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ============= Fill-in-the-Blanks Quiz Generation =============

/**
 * Generate fill-in-the-blanks questions from a topic
 * 
 * @param topic - The topic to generate questions about
 * @param amount - Number of questions to generate
 * @param userType - User's subscription type
 * @param session - Optional user session
 * @returns Quiz with fill-in-the-blanks questions
 * 
 * @example
 * const quiz = await generateFillInBlanksFromTopic("Python Basics", 8, "BASIC", session)
 */
export async function generateFillInBlanksFromTopic(
  topic: string,
  amount: number,
  userType: string = 'FREE',
  session?: Session | null
): Promise<Quiz> {
  try {
    const context = session
      ? createContextFromSession(session)
      : createContext(undefined, userType, false, 0)

    const service = AIServiceFactory.createService(context)
    
    const result = await (service as any).generateFillInTheBlanksQuiz({
      topic,
      numberOfQuestions: amount,
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate fill-in-the-blanks quiz')
    }

    // Parse and return quiz data
    const quizData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
    
    return {
      id: Date.now().toString(),
      title: topic,
      questions: quizData.questions || quizData,
    }
  } catch (error) {
    console.error('Error generating fill-in-the-blanks quiz:', error)
    throw new Error(`Failed to generate fill-in-the-blanks quiz: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * @deprecated Use generateFillInBlanksFromTopic instead - will be removed in v2.0
 * @see generateFillInBlanksFromTopic

// ============= Video Quiz Generation =============

/**
 * Generate multiple choice questions from video chapters/transcript
 * 
 * @param courseTitle - The course title
 * @param transcript - Video transcript text
 * @param numQuestions - Number of questions to generate (default: 5)
 * @param userType - User subscription type (default: "FREE")
 * @returns Array of multiple choice questions
 * 
 * @example
 * const questions = await generateMCQFromChapters("React Basics", transcript, 5, "PREMIUM")
 */
export async function generateMCQFromChapters(
  courseTitle: string,
  transcript: string,
  numQuestions: number = 5,
  userType: string = "FREE"
): Promise<any[]> {
  try {
    const context = createContext(undefined, userType, false, 100)
    const service = AIServiceFactory.createService(context) as BasicAIService
    
    const result = await service.generateVideoQuiz({
      courseTitle,
      transcript,
      numberOfQuestions: numQuestions,
      quizType: 'mcq',
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate video quiz')
    }

    return Array.isArray(result.data) ? result.data : (result.data as any).questions || []
  } catch (error) {
    console.error('Error generating video quiz:', error)
    throw new Error(`Failed to generate video quiz: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ============= Course Content Generation =============

/**
 * Generate course units with chapters and YouTube search queries
 * 
 * @param title - Course title
 * @param units - Array of unit names
 * @returns Array of unit content with chapters
 * 
 * @example
 * const content = await generateCourseUnits("Python Programming", ["Variables", "Functions"])
 */
export async function generateCourseUnits(
  title: string,
  units: string[]
): Promise<Array<{
  title: string
  chapters: Array<{
    chapter_title: string
    youtube_search_query: string
  }>
}>> {
  try {
    const context = createContext(undefined, 'PREMIUM', true, 100)
    const service = AIServiceFactory.createService(context) as any
    
    const unitContent = []
    
    for (const unit of units) {
      const result = await service.generateCourseContent({
        topic: `${title} - ${unit}`,
        numberOfModules: 5,
        includeQuizzes: false,
      })

      if (!result.success) {
        throw new Error(result.error || `Failed to generate content for unit: ${unit}`)
      }

      const courseData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
      
      const chapters = (courseData.modules || []).map((module: any) => ({
        chapter_title: module.title,
        youtube_search_query: `${title} ${unit} ${module.title} tutorial`,
      }))

      unitContent.push({
        title: unit,
        chapters,
      })
    }

    return unitContent
  } catch (error) {
    console.error('Error generating course content:', error)
    throw new Error(`Failed to generate course content: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * @deprecated Use generateCourseUnits instead - will be removed in v2.0
 * @see generateCourseUnits

// ============= Summary Generation =============

/**
 * Generate text summary from transcript
 * 
 * @param transcript - Text transcript to summarize
 * @param summaryLength - Target length in words (default: 250)
 * @param tokenLimit - Maximum tokens to use (default: 4000)
 * @returns Generated summary or null on error
 * 
 * @example
 * const summary = await generateTextSummary(transcript, 200, 4000)
 */
export async function generateTextSummary(
  transcript: string,
  summaryLength: number = 250,
  tokenLimit: number = 4000
): Promise<string | null> {
  try {
    const context = createContext(undefined, 'FREE', true, 10)
    const service = AIServiceFactory.createService(context) as BasicAIService
    
    const result = await service.generateSummary({
      transcript,
      summaryLength,
      maxTokens: tokenLimit,
    })

    if (!result.success) {
      console.error('Summary generation failed:', result.error)
      return null
    }

    return result.data || null
  } catch (error) {
    console.error('Error generating summary:', error)
    return null
  }
}
