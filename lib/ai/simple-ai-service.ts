/**
 * Simple AI Service Helper
 * 
 * Provides a simplified interface to AI services without circular dependencies.
 * This module can be safely imported anywhere without initialization issues.
 */

import type { SubscriptionPlanType } from '@/types/subscription'

// Simple context type
export interface SimpleAIContext {
  userId?: string
  subscriptionPlan: SubscriptionPlanType
  isAuthenticated: boolean
  credits?: number
}

/**
 * Create AI service and execute a method
 * Uses dynamic imports to avoid circular dependencies
 */
export async function executeAIService<T = any>(
  context: SimpleAIContext,
  method: string,
  params: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // Dynamic import to avoid initialization issues
    const { AIServiceFactory } = await import('@/lib/ai/services/AIServiceFactory')
    
    const service = AIServiceFactory.createService(context) as any
    
    if (typeof service[method] !== 'function') {
      throw new Error(`Method ${method} not found on AI service`)
    }
    
    const result = await service[method](params)
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'AI service failed'
      }
    }
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error(`[SimpleAIService] Error executing ${method}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
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
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateMultipleChoiceQuiz', {
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
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan,
    isAuthenticated: !!userId,
    credits: 999,
  }
  
  const result = await executeAIService(context, 'generateFlashcards', {
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
  numberOfSteps: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateOrderingQuiz', {
    topic,
    numberOfSteps,
    difficulty,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate ordering quiz')
  }
  
  return typeof result.data === 'string' ? JSON.parse(result.data) : result.data
}

/**
 * Generate fill-in-the-blanks quiz
 */
export async function generateFillInBlanks(
  topic: string,
  numberOfQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateFillInTheBlanksQuiz', {
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
  subscriptionPlan: SubscriptionPlanType = 'FREE'
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
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateOpenEndedQuestionsQuiz', {
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
  numberOfUnits: number = 3,
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateCourseContent', {
    topic,
    numberOfUnits,
  })
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate course content')
  }
  
  return typeof result.data === 'string' ? JSON.parse(result.data) : result.data
}

/**
 * Generate text summary
 */
export async function generateSummary(
  transcript: string,
  summaryLength: number = 250,
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateSummary', {
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
  numberOfQuestions: number = 5,
  userId?: string,
  subscriptionPlan: SubscriptionPlanType = 'FREE'
) {
  const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  const context: SimpleAIContext = {
    userId,
    subscriptionPlan: validPlans.includes(subscriptionPlan) ? subscriptionPlan : 'FREE',
    isAuthenticated: userId != null && userId !== '',
    credits: 999, // Admin debug: provide unlimited credits for testing
  }
  
  const result = await executeAIService(context, 'generateVideoQuiz', {
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
