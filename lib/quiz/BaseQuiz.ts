import type { BaseQuizPreview, BaseQuizResult } from "@/app/types/quiz-base"
import type { QuizType, UserAnswer } from "@/app/types/quiz-types"

export abstract class BaseQuiz {
  protected type: QuizType
  protected questions: any[]
  protected answers: UserAnswer[]
  
  constructor(type: QuizType) {
    this.type = type
    this.questions = []
    this.answers = []
  }

  abstract validateAnswer(answer: any): boolean
  abstract calculateScore(): number
  abstract generatePreview(): BaseQuizPreview
  abstract formatResult(): BaseQuizResult
  
  // Common utility methods
  protected getProgress(): number {
    return (this.answers.length / Math.max(1, this.questions.length)) * 100
  }

  protected getCorrectAnswersCount(): number {
    return this.answers.filter(a => a.isCorrect).length
  }
}
