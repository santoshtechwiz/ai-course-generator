/**
 * Quiz Helper Utilities
 * 
 * This module provides utility functions for the quiz slice, including:
 * - String handling and normalization
 * - Score calculation
 * - State persistence and hydration
 * - Input validation
 * 
 * @author Manus AI
 * @version 2.0.0
 */

import { hydrateFromStorage } from "../../../middlewares/store/persistence"
import { STORAGE_KEYS } from '@/constants/global'
import type { QuizState, QuizAnswer, QuizQuestion, QuizResults, QuestionResult, QuizType } from "./quiz-types"
import { API_PATHS } from '@/constants/global'

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  mcq: API_PATHS.MCQ,
  code: API_PATHS.CODE,
  blanks: API_PATHS.BLANKS,
  openended: API_PATHS.OPENENDED,
  common: API_PATHS.COMMON,
  // Support for the unified API approach
  unified: API_PATHS.UNIFIED,
  byType: API_PATHS.byType,
  byTypeAndSlug: API_PATHS.byTypeAndSlug,
  // Type-specific helpers
  getMcqQuiz: API_PATHS.getMcqQuiz,
  getCodeQuiz: API_PATHS.getCodeQuiz,
  getBlanksQuiz: API_PATHS.getBlanksQuiz,
  getOpenEndedQuiz: API_PATHS.getOpenEndedQuiz,
  getFlashcardQuiz: API_PATHS.getFlashcardQuiz
} as const

export class QuizHelpers {
  /**
   * Safe string conversion utility to prevent type errors
   */
  static safeString(value: any): string {
    if (value === null || value === undefined) return ''
    return typeof value === 'string' ? value : String(value)
  }

  /**
   * Normalize slug input to handle various input types
   */
  static normalizeSlug(slugInput: any): string {
    if (typeof slugInput === "object" && slugInput !== null) {
      return this.safeString(slugInput.slug || slugInput.id || slugInput)
    }
    return this.safeString(slugInput)
  }

  /**
   * Calculate quiz score from answers and questions
   */
  static calculateQuizScore(answers: Record<string, QuizAnswer>, questions: QuizQuestion[]) {
    let correctCount = 0
    let totalCount = 0

    questions.forEach(question => {
      const answer = answers[String(question.id)]
      if (!answer) return

      totalCount++
      if (answer.isCorrect) {
        correctCount++
      }
    })

    return {
      score: correctCount,
      totalQuestions: totalCount,
      percentage: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    }
  }

  /**
   * Load persisted state from storage for hydration
   */
  static loadPersistedState(): Partial<QuizState> {
    try {
      const persisted = hydrateFromStorage<Partial<QuizState>>(STORAGE_KEYS.QUIZ_STATE)
      return persisted || {}
    } catch (error) {
      console.warn("Failed to load persisted quiz state:", error)
      return {}
    }
  }

  /**
   * Generate question results from answers and questions
   */
  static generateQuestionResults(questions: QuizQuestion[], answers: Record<string, QuizAnswer>): QuestionResult[] {
    return questions.map((question) => {
      const qid = String(question.id)
      const answer = answers[qid]
      const isCorrect = answer?.isCorrect === true

      return {
        questionId: qid,
        isCorrect,
        userAnswer: answer?.selectedOptionId || answer?.userAnswer || null,
        correctAnswer: question.correctOptionId || question.answer || "",
        skipped: !answer
      }
    })
  }

  /**
   * Generate full quiz results from current state
   */
  static generateQuizResults(
    questions: QuizQuestion[],
    answers: Record<string, QuizAnswer>,
    slug: string,
    quizType: QuizType
  ): QuizResults {
    const scoreData = this.calculateQuizScore(answers, questions)
    const questionResults = this.generateQuestionResults(questions, answers)

    return {
      slug: slug,
      quizType: quizType || "mcq" as QuizType,
      score: scoreData.score,
      maxScore: scoreData.totalQuestions,
      percentage: scoreData.percentage,
      completedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      answers: Object.values(answers),
      results: questionResults,
    }
  }
  
  /**
   * Generate simplified quiz results for selectors
   */
  static generateSimpleQuizResults(
    questions: QuizQuestion[],
    answers: Record<string, QuizAnswer>,
    slug: string,
    quizType: QuizType
  ): QuizResults | null {
    if (!answers || !questions || Object.keys(answers).length === 0 || questions.length === 0) {
      return null
    }
    
    return this.generateQuizResults(questions, answers, slug, quizType)
  }

  /**
   * Validates quiz data structure
   */
  static isValidQuizData(data: any): boolean {
    return Boolean(
      data && 
      Array.isArray(data.questions) && 
      data.questions.length > 0
    )
  }
}
