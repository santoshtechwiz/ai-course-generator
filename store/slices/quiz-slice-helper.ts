/**
 * QuizSliceHelper - Utility Class for Quiz Slice
 * 
 * This class provides utility functions for the quiz Redux slice, including:
 * - String handling and normalization
 * - Score calculation
 * - State persistence and hydration
 * - Input validation
 * 
 * Centralizing these utilities improves code organization, testability,
 * and maintenance by separating pure utility functions from Redux logic.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { hydrateFromStorage } from "../middleware/persistMiddleware"
import { STORAGE_KEYS } from "@/constants/global"
import type { QuizState, QuizAnswer, QuizQuestion, QuizResults, QuestionResult } from "./quiz-slice-types"
import { API_PATHS } from "@/constants/global"

/**
 * API endpoints configuration
 * Export for consistency across the application
 */
export const API_ENDPOINTS = {
  mcq: API_PATHS.MCQ,
  code: API_PATHS.CODE,
  blanks: API_PATHS.BLANKS,
  openended: API_PATHS.OPENENDED,
  common: API_PATHS.COMMON,
} as const

export class QuizSliceHelper {
  /**
   * Safe string conversion utility to prevent type errors
   * @param value - Any value to convert to string
   * @returns Safe string representation
   */
  static safeString(value: any): string {
    if (value === null || value === undefined) return ''
    return typeof value === 'string' ? value : String(value)
  }

  /**
   * Normalize slug input to handle various input types
   * @param slugInput - Input that could be string, object, or other type
   * @returns Normalized string slug
   */
  static normalizeSlug(slugInput: any): string {
    if (typeof slugInput === "object" && slugInput !== null) {
      return this.safeString(slugInput.slug || slugInput.id || slugInput)
    }
    return this.safeString(slugInput)
  }

  /**
   * Calculate quiz score from answers and questions
   * @param answers - User answers record
   * @param questions - Quiz questions array
   * @returns Score calculation results
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
   * This function safely handles storage access and parsing
   * @returns Partial quiz state from storage or empty object
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
   * @param questions - Quiz questions array
   * @param answers - User answers record
   * @returns Array of question results
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
   * @param questions - Quiz questions array
   * @param answers - User answers record
   * @param slug - Quiz slug
   * @param quizId - Quiz ID (optional, will use slug if not provided)
   * @param title - Quiz title
   * @param quizType - Quiz type
   * @returns Complete quiz results object
   */
  static generateQuizResults(
    questions: QuizQuestion[],
    answers: Record<string, QuizAnswer>,
    slug: string,
    quizId: string | null,
    title: string,
    quizType: string
  ): QuizResults {
    // Calculate score metrics
    const scoreData = this.calculateQuizScore(answers, questions)
    
    // Generate question results
    const questionResults = this.generateQuestionResults(questions, answers)

    return {
      quizId: quizId || slug,
      slug: slug,
      title: title || "Quiz Results",
      quizType: quizType || "mcq",
      score: scoreData.score,
      maxScore: scoreData.totalQuestions,
      totalAnswered: scoreData.totalQuestions,
      percentage: scoreData.percentage,
      completedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      questions,
      answers: Object.values(answers),
      questionResults,
    }
  }
  
  /**
   * Generate simplified quiz results for selectors
   * @param questions - Quiz questions array
   * @param answers - User answers record
   * @param title - Quiz title
   * @param quizId - Quiz ID
   * @returns Simple quiz results object
   */
  static generateSimpleQuizResults(
    questions: QuizQuestion[],
    answers: Record<string, QuizAnswer>,
    title: string,
    quizId: string
  ) {
    // Protect against null/undefined values
    if (!answers || !questions || Object.keys(answers).length === 0 || questions.length === 0) {
      return null
    }
    
    // Calculate score metrics
    const scoreData = this.calculateQuizScore(answers, questions)
    
    // Generate question results
    const questionResults = this.generateQuestionResults(questions, answers)
    
    return {
      quizId,
      slug: quizId,
      title: title || `Quiz ${quizId}`,
      completedAt: new Date().toISOString(),
      maxScore: scoreData.totalQuestions,
      score: scoreData.score,
      percentage: scoreData.percentage,
      questionResults,
      questions,
    }
  }

  /**
   * Validates quiz data structure
   * @param data - Quiz data to validate
   * @returns boolean indicating if the data is valid
   */
  static isValidQuizData(data: any): boolean {
    return Boolean(
      data && 
      Array.isArray(data.questions) && 
      data.questions.length > 0
    )
  }
}
