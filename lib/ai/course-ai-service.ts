/**
 * Simple AI Service Helper
 * 
 * Provides a simplified interface to AI services without circular dependencies.
 * This module can be safely imported anywhere without initialization issues.
 */

/**
 * CourseAI Service - Unified AI Service Interface
 * Provides high-level functions for course and quiz generation
 */

import type { SubscriptionPlanType } from '@/types/subscription-plans'

// ============================================================================
// ENUMS & TYPES
// ============================================================================

/**
 * AI Service Method Names - Provides compile-time safety and autocomplete
 */
export enum AIServiceMethod {
  GENERATE_MULTIPLE_CHOICE_QUIZ = 'generateMultipleChoiceQuiz',
  GENERATE_FLASHCARDS = 'generateFlashcards',
  GENERATE_ORDERING_QUIZ = 'generateOrderingQuiz',
  GENERATE_FILL_IN_THE_BLANKS_QUIZ = 'generateFillInTheBlanksQuiz',
  GENERATE_OPEN_ENDED_QUESTIONS_QUIZ = 'generateOpenEndedQuestionsQuiz',
  GENERATE_COURSE_CONTENT = 'generateCourseContent',
  GENERATE_SUMMARY = 'generateSummary',
  GENERATE_VIDEO_QUIZ = 'generateVideoQuiz',
}

/**
 * Simple AI Context for basic operations
 */
interface SimpleAIContext {
  userId?: string
  subscriptionPlan: SubscriptionPlanType
  isAuthenticated: boolean
  credits?: number
}

/**
 * Create AI service and execute a method
 * Uses dynamic imports to avoid circular dependencies
 */
async function executeAIService<T = any>(
  context: SimpleAIContext,
  method: AIServiceMethod,
  params: any
): Promise<{ success: boolean; data?: T; error?: string; errorCode?: string }> {
  try {
    // Dynamic import to avoid initialization issues
    const { AIServiceFactory } = await import('@/lib/ai/services/AIServiceFactory')
    
    const service = AIServiceFactory.createService(context) as any
    
    if (typeof service[method] !== 'function') {
      throw new Error(`Method ${method} not found on AI service`)
    }
    
    const result = await service[method](params)
    
    if (!result.success) {
      // Process error message for better user experience
      let errorMessage = result.error || 'AI service failed'
      let errorCode = result.errorCode || 'SERVICE_ERROR'
      
      if (result.error) {
        const error = new Error(result.error)
        if (error.message.toLowerCase().includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.'
          errorCode = 'RATE_LIMIT'
        } else if (error.message.toLowerCase().includes('quota')) {
          errorMessage = 'API quota exceeded. Please upgrade your plan.'
          errorCode = 'QUOTA_EXCEEDED'
        } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.'
          errorCode = 'NETWORK_ERROR'
        } else if (error.message.toLowerCase().includes('authentication') || error.message.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Authentication failed. Please log in again.'
          errorCode = 'AUTH_ERROR'
        } else if (error.message.toLowerCase().includes('subscription') || error.message.toLowerCase().includes('plan')) {
          errorMessage = 'Subscription plan does not support this feature.'
          errorCode = 'SUBSCRIPTION_ERROR'
        } else if (error.message.toLowerCase().includes('access_denied') || error.message.toLowerCase().includes('feature flag')) {
          errorMessage = 'This feature is currently unavailable. Please try again later or contact support.'
          errorCode = 'FEATURE_UNAVAILABLE'
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode
      }
    }
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error(`[executeAIService] Error executing ${method}:`, error)
    
    // Provide more specific error messages based on error type
    let errorMessage = 'An error occurred while processing your request.'
    let errorCode = 'UNKNOWN_ERROR'
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
        errorCode = 'RATE_LIMIT'
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please upgrade your plan.'
        errorCode = 'QUOTA_EXCEEDED'
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.'
        errorCode = 'NETWORK_ERROR'
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed. Please log in again.'
        errorCode = 'AUTH_ERROR'
      } else if (error.message.includes('subscription') || error.message.includes('plan')) {
        errorMessage = 'Subscription plan does not support this feature.'
        errorCode = 'SUBSCRIPTION_ERROR'
      } else if (error.message.includes('access_denied') || error.message.includes('feature flag')) {
        errorMessage = 'This feature is currently unavailable. Please try again later or contact support.'
        errorCode = 'FEATURE_UNAVAILABLE'
      } else {
        errorMessage = error.message
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode
    }
  }
}

/**
 * Generate multiple choice quiz questions
 */
export async function generateMCQ(
  topic: string,
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0,
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_MULTIPLE_CHOICE_QUIZ, {
    topic,
    numberOfQuestions,
    difficulty,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate MCQ')
  }
  
  const questions = typeof result.data === 'string' 
    ? JSON.parse(result.data) 
    : result.data
    
  return Array.isArray(questions) ? questions : questions.questions || []
}

/**
 * Generate flashcards
 */
export async function generateFlashcards(
  topic: string,
  count: number = 5,
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan,
    isAuthenticated: !!userId,
    credits: credits || 0,
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_FLASHCARDS, {
    topic,
    count,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate flashcards')
  }
  
  // Handle both array and object responses
  const flashcards = typeof result.data === 'string' 
    ? JSON.parse(result.data) 
    : result.data
    
  const cardsArray = Array.isArray(flashcards) ? flashcards : flashcards.flashcards || []
  
  return {
    flashcards: cardsArray.map((card: any, index: number) => ({
      id: index + 1,
      question: card.question,
      answer: card.answer,
    }))
  }
}

/**
 * Generate ordering quiz
 */
export async function generateOrderingQuiz(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number,
  numberOfQuestions: number = 3
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0,
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_ORDERING_QUIZ, {
    topic,
    difficulty,
    numberOfSteps: 5, // Default 5 steps per question
    numberOfQuestions,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate ordering quiz')
  }
  
  const quizData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
  
  // Extract questions array - handle different response formats
  let questions = []
  
  // If AI returned { questions: [...] }, use the questions array
  if (quizData.questions && Array.isArray(quizData.questions)) {
    questions = quizData.questions
  }
  // If AI returned an array directly
  else if (Array.isArray(quizData)) {
    questions = quizData
  }
  // If AI returned a single question object (backward compatibility)
  else if (quizData.title && quizData.steps && Array.isArray(quizData.steps)) {
    questions = [quizData]
  }
  
  // Ensure all questions have required fields
  const validQuestions = questions.filter(
    (q: any) => q.title && q.description && Array.isArray(q.steps) && q.steps.length > 0
  )
  
  if (validQuestions.length === 0) {
    throw new Error('No valid ordering quiz questions generated')
  }
  
  return {
    id: Date.now().toString(),
    title: `${topic} - Ordering Quiz`,
    questions: validQuestions,
  }
}

/**
 * Generate fill-in-the-blanks quiz
 */
export async function generateFillInBlanks(
  topic: string,
  numberOfQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_FILL_IN_THE_BLANKS_QUIZ, {
    topic,
    numberOfQuestions,
    difficulty,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate fill-in-blanks quiz')
  }
  
  const quizData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
  
  return {
    id: Date.now().toString(),
    title: topic,
    questions: quizData.questions || quizData,
  }
}

/**
 * Generate open-ended questions
 */
export async function generateOpenEnded(
  topic: string,
  numberOfQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  // Check if user has PREMIUM plan - open-ended questions are PREMIUM only
  if (subscriptionPlan !== 'PREMIUM' && subscriptionPlan !== 'ENTERPRISE') {
    throw new Error('Open-ended questions are only available for PREMIUM users. Please upgrade your subscription.')
  }

  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_OPEN_ENDED_QUESTIONS_QUIZ, {
    topic,
    numberOfQuestions,
    difficulty,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate open-ended quiz')
  }
  
  const quizData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
  
  return {
    id: Date.now().toString(),
    title: topic,
    questions: quizData.questions || quizData,
  }
}

/**
 * Generate course content
 */
export async function generateCourse(
  topic: string,
  units: string[],
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_COURSE_CONTENT, {
    topic,
    units,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate course content')
  }
  
  return typeof result.data === 'string' ? JSON.parse(result.data) : result.data
}

/**
 * Generate text summary
 */
async function generateSummary(
  transcript: string,
  summaryLength: number = 250,
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_SUMMARY, {
    transcript,
    summaryLength,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate summary')
  }
  
  return result.data
}

/**
 * Generate video quiz
 */
export async function generateVideoQuiz(
  courseTitle: string,
  transcript: string,
  numberOfQuestions: number,
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE',
  credits?: number
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: credits || 0, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, AIServiceMethod.GENERATE_VIDEO_QUIZ, {
    courseTitle,
    transcript,
    numberOfQuestions,
    quizType: 'mcq',
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate video quiz')
  }
  
  return result.data
}
