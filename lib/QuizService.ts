import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import { cache } from 'react'

import { getQuiz } from "@/app/actions/getQuiz"


import { quizStorageService, type QuizState, type QuizResult, type QuizAnswer } from "@/lib/quiz-storage-service"
import type { QuizType } from "@/app/types/quiz-types"
import getMcqQuestions from "@/app/actions/getMcqQuestions"

class QuizService {
  private static instance: QuizService

  private constructor() {}

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService()
    }
    return QuizService.instance
  }

  async getQuizData(slug: string, quizType: QuizType): Promise<any> {
    try {
      switch (quizType) {
        case "mcq":
          const mcqData = await getMcqQuestions(slug)
          return mcqData
        default:
          const quizData = await getQuiz(slug)
          return quizData
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error)
      throw error
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await getServerSession(authOptions)
    return !!session?.user
  }

  async getCurrentUserId(): Promise<string | undefined> {
    const session = await getServerSession(authOptions)
    return session?.user?.id
  }

  saveQuizState(state: QuizState): void {
    quizStorageService.saveQuizState(state)
  }

  getQuizState(quizId: string, quizType: QuizType): QuizState | null {
    return quizStorageService.getQuizState(quizId, quizType)
  }

  clearQuizState(quizId: string, quizType: QuizType): void {
    quizStorageService.clearQuizState(quizId, quizType)
  }

  saveQuizResult(result: QuizResult): void {
    quizStorageService.saveQuizResult(result)
  }

  getQuizResult(quizId: string): QuizResult | null {
    return quizStorageService.getQuizResult(quizId)
  }

  isQuizCompleted(quizId: string): boolean {
    return quizStorageService.isQuizCompleted(quizId)
  }

  saveGuestResult(result: QuizResult): void {
    quizStorageService.saveGuestResult(result)
  }

  getGuestResult(quizId: string): QuizResult | null {
    return quizStorageService.getGuestResult(quizId)
  }

  clearGuestResult(quizId: string): void {
    quizStorageService.clearGuestResult(quizId)
  }

  clearAllQuizData(): void {
    quizStorageService.clearAllQuizData()
  }

  calculateSimilarity(str1: string, str2: string): number {
    return quizStorageService.calculateSimilarity(str1, str2)
  }

  calculateScore(answers: QuizAnswer[], quizType: QuizType): number {
    return quizStorageService.calculateScore(answers, quizType)
  }

  countCorrectAnswers(answers: QuizAnswer[], quizType: QuizType): number {
    return quizStorageService.countCorrectAnswers(answers, quizType)
  }
}

export const quizService = QuizService.getInstance()