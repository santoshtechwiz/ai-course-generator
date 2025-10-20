/**
 * AI Service - Ordering Quiz and Flashcard Generation
 * 
 * This file now re-exports the new subscription-aware wrapper functions.
 * The actual implementations are in lib/ai/services/wrappers.ts
 */

import type { FlashCard } from "@/app/types/types"

// Ordering/Sequencing Quiz types
export interface OrderingQuizStep {
  id: number
  description: string
  explanation?: string
}

/**
 * Represents a full ordering quiz question where users must arrange steps in logical order.
 */
export interface OrderingQuizQuestion {
  id: string | number
  title: string
  topic: string
  steps: OrderingQuizStep[]
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  type: 'ordering'

  /** The correct order of step IDs, e.g., [0, 1, 2, 3] */
  correctOrder?: number[]

  /** The total number of steps, derived for validation or progress tracking */
  numberOfSteps?: number

  /** Optional explanations for each step (used when showing results) */
  explanations?: string[]
}

// Re-export the new subscription-aware functions from wrappers
export { 
  generateFlashCards,
  generateOrderingQuiz,
} from '@/lib/ai/services/wrappers'

/**
 * Validate user's ability to generate ordering quizzes based on subscription plan
 * @param userPlan - User's subscription plan
 * @param quizzesGeneratedToday - Number of quizzes generated today
 * @returns Object with canGenerate flag and reason if not allowed
 */
export function checkOrderingQuizAccess(
  userPlan: 'FREE' | 'PREMIUM' | 'PRO' = 'FREE',
  quizzesGeneratedToday: number = 0
): { canGenerate: boolean; reason?: string; limitPerDay: number } {
  const limits = {
    'FREE': 2,
    'PREMIUM': 10,
    'PRO': 50,
  }

  const limitPerDay = limits[userPlan]

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
