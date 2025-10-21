/**
 * Adaptive Feedback Service
 * 
 * Provides tiered feedback based on:
 * - User authentication status (guest vs signed-in)
 * - Number of incorrect attempts
 * - Question difficulty
 * 
 * Features:
 * - Graduated hint system
 * - Contextual resource suggestions
 * - Answer reveal for authenticated users after multiple attempts
 */

import { calculateAnswerSimilarity } from './text-similarity'

interface AdaptiveFeedbackConfig {
  /** Is the user authenticated? */
  isAuthenticated: boolean
  /** Current attempt count for this question */
  attemptCount: number
  /** Question difficulty (1-5) */
  difficulty?: number
  /** User's current answer */
  userAnswer: string
  /** Correct answer */
  correctAnswer: string
  /** Available hints */
  hints?: string[]
  /** Related course/topic slug for resource suggestions */
  relatedTopicSlug?: string
}

export interface FeedbackResponse {
  /** Current similarity score (0-1) */
  similarity: number
  /** Is the answer acceptable? */
  isAcceptable: boolean
  /** Feedback message to display */
  message: string
  /** Optional: recommended hint spoiler level to show next */
  recommendedSpoilerLevel?: 'low' | 'medium' | 'high'
  /** Optional: whether UI may offer a full-answer reveal as a user-action (not automatic) */
  allowFullReveal?: boolean
  /** Suggested resources */
  suggestedResources?: Array<{
    title: string
    url: string
    type: 'course' | 'quiz' | 'article'
  }>
  /** Encouragement level (1-3) */
  encouragementLevel: 1 | 2 | 3
}

/**
 * Get adaptive feedback based on user status and attempt count
 */
export function getAdaptiveFeedback(config: AdaptiveFeedbackConfig): FeedbackResponse {
  const {
    isAuthenticated,
    attemptCount,
    userAnswer,
    correctAnswer,
    hints = [],
    relatedTopicSlug
  } = config

  // Calculate similarity using existing utility
  const similarityResult = calculateAnswerSimilarity(userAnswer, correctAnswer)
  const similarity = similarityResult.similarity
  const isAcceptable = similarity >= 0.8

  // If answer is acceptable, return positive feedback
  if (isAcceptable) {
    return {
      similarity,
      isAcceptable: true,
      message: getSuccessMessage(similarity),
      allowFullReveal: false,
      encouragementLevel: 3
    }
  }

  // GUEST USER FLOW - Limited feedback
  if (!isAuthenticated) {
    return getGuestFeedback(similarity, attemptCount, hints[0])
  }

  // AUTHENTICATED USER FLOW - Full feedback
  return getAuthenticatedFeedback(
    similarity,
    attemptCount,
    hints,
    correctAnswer,
    relatedTopicSlug
  )
}

/**
 * Generate feedback for guest users
 * - Limited hints (only first hint)
 * - No answer reveal
 * - Encourage sign-up after 2 attempts
 */
function getGuestFeedback(
  similarity: number,
  attemptCount: number,
  firstHint?: string
): FeedbackResponse {
  // First attempt - general encouragement
  if (attemptCount === 1) {
    return {
      similarity,
      isAcceptable: false,
      message: getSimilarityMessage(similarity) + " Try again!",
      hint: similarity < 0.3 ? firstHint : undefined,
      allowFullReveal: false,
      encouragementLevel: 2
    }
  }

  // Second attempt - show first hint if available
  if (attemptCount === 2) {
    return {
      similarity,
      isAcceptable: false,
      message: "You're getting closer! " + (firstHint ? "Here's a hint:" : ""),
      hint: firstHint,
      allowFullReveal: false,
      encouragementLevel: 2
    }
  }

  // Third+ attempt - encourage sign-in
  return {
    similarity,
    isAcceptable: false,
    message: "Want more hints and learning resources? Sign in to unlock full feedback!",
    allowFullReveal: false,
    suggestedResources: [{
      title: "Sign in to continue",
      url: `/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
      type: 'article' as const
    }],
    encouragementLevel: 1
  }
}

/**
 * Generate feedback for authenticated users
 * - Progressive hints
 * - Answer reveal after 3+ attempts
 * - Resource suggestions
 */
function getAuthenticatedFeedback(
  similarity: number,
  attemptCount: number,
  hints: string[],
  correctAnswer: string,
  relatedTopicSlug?: string
): FeedbackResponse {
  // First attempt - encouraging message
  if (attemptCount === 1) {
    return {
      similarity,
      isAcceptable: false,
      message: getSimilarityMessage(similarity) + " Think carefully and try again.",
      hint: similarity < 0.3 ? hints[0] : undefined,
      allowFullReveal: false,
      encouragementLevel: 2
    }
  }

  // Second attempt - show first hint
  if (attemptCount === 2) {
    return {
      similarity,
      isAcceptable: false,
      message: "You're making progress! Here's a hint to help:",
      hint: hints[0],
      allowFullReveal: false,
      encouragementLevel: 2
    }
  }

  // Third attempt - show second hint if available
  if (attemptCount === 3 && hints[1]) {
    return {
      similarity,
      isAcceptable: false,
      message: "Almost there! Here's another hint:",
      hint: hints[1],
      allowFullReveal: false,
      encouragementLevel: 2
    }
  }

  // Fourth+ attempt - reveal answer and suggest resources
  return {
    similarity,
    isAcceptable: false,
    message: "Let's review the correct answer and some resources to help you understand:",
    hint: hints[hints.length - 1], // Show last hint
    allowFullReveal: true,
    suggestedResources: relatedTopicSlug ? [
      {
        title: "Review the related course",
        url: `/dashboard/course/${relatedTopicSlug}`,
        type: 'course' as const
      },
      {
        title: "Practice with similar quizzes",
        url: `/dashboard/explore?topic=${relatedTopicSlug}`,
        type: 'quiz' as const
      }
    ] : undefined,
    encouragementLevel: 1
  }
}

/**
 * Get success message based on similarity
 */
function getSuccessMessage(similarity: number): string {
  if (similarity >= 0.95) {
    return "Perfect! You nailed it! 🎉"
  } else if (similarity >= 0.9) {
    return "Excellent answer! Great job! ✨"
  } else if (similarity >= 0.85) {
    return "Very good! Your answer is spot on! ✓"
  } else {
    return "Correct! Well done! ✓"
  }
}

/**
 * Get feedback message based on similarity
 */
function getSimilarityMessage(similarity: number): string {
  if (similarity >= 0.7) {
    return "You're very close!"
  } else if (similarity >= 0.5) {
    return "You're on the right track."
  } else if (similarity >= 0.3) {
    return "You're getting warmer."
  } else {
    return "Not quite right."
  }
}

/**
 * Track question attempts for adaptive learning
 * Stores in localStorage for persistence
 */
export class AttemptTracker {
  private static readonly STORAGE_KEY = 'quiz_attempts'
  private static readonly MAX_STORAGE_DAYS = 30

  /**
   * Get attempt count for a specific question
   */
  static getAttemptCount(questionId: string | number, quizSlug: string): number {
    if (typeof window === 'undefined') return 0

    try {
      const data = this.getData()
      const key = `${quizSlug}_${questionId}`
      const attempt = data[key]

      if (!attempt) return 0

      // Check if data is expired
      const age = Date.now() - attempt.timestamp
      const maxAge = this.MAX_STORAGE_DAYS * 24 * 60 * 60 * 1000

      if (age > maxAge) {
        this.clearAttempt(questionId, quizSlug)
        return 0
      }

      return attempt.count
    } catch {
      return 0
    }
  }

  /**
   * Increment attempt count for a question
   */
  static incrementAttempt(questionId: string | number, quizSlug: string): number {
    if (typeof window === 'undefined') return 1

    try {
      const data = this.getData()
      const key = `${quizSlug}_${questionId}`
      const current = data[key]?.count || 0
      const newCount = current + 1

      data[key] = {
        count: newCount,
        timestamp: Date.now(),
        quizSlug,
        questionId: String(questionId)
      }

      this.saveData(data)
      return newCount
    } catch {
      return 1
    }
  }

  /**
   * Clear attempts for a specific question
   */
  static clearAttempt(questionId: string | number, quizSlug: string): void {
    if (typeof window === 'undefined') return

    try {
      const data = this.getData()
      const key = `${quizSlug}_${questionId}`
      delete data[key]
      this.saveData(data)
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear all attempts for a quiz
   */
  static clearQuizAttempts(quizSlug: string): void {
    if (typeof window === 'undefined') return

    try {
      const data = this.getData()
      const keys = Object.keys(data).filter(key => data[key].quizSlug === quizSlug)
      
      keys.forEach(key => delete data[key])
      this.saveData(data)
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear all expired attempts
   */
  static clearExpiredAttempts(): void {
    if (typeof window === 'undefined') return

    try {
      const data = this.getData()
      const maxAge = this.MAX_STORAGE_DAYS * 24 * 60 * 60 * 1000
      const now = Date.now()

      Object.keys(data).forEach(key => {
        if (now - data[key].timestamp > maxAge) {
          delete data[key]
        }
      })

      this.saveData(data)
    } catch {
      // Silently fail
    }
  }

  private static getData(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private static saveData(data: Record<string, any>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Silently fail
    }
  }
}

// Clear expired attempts on load (only in browser)
if (typeof window !== 'undefined') {
  AttemptTracker.clearExpiredAttempts()
}
