import { BaseQuiz } from "./BaseQuiz"
import type { CodeQuizQuestion } from "@/app/types/code-quiz-types"
import type { BaseQuizPreview, BaseQuizResult } from "@/app/types/quiz-base"

export class CodeQuiz extends BaseQuiz {
  private codeQuestions: CodeQuizQuestion[]

  constructor(questions: CodeQuizQuestion[] = []) {
    super("code")
    this.codeQuestions = questions
  }

  validateAnswer(answer: string): boolean {
    // Add code validation logic here
    return answer.trim().length > 0
  }

  calculateScore(): number {
    return this.getCorrectAnswersCount()
  }

  generatePreview(): BaseQuizPreview {
    return {
      type: this.type,
      score: this.calculateScore(),
      maxScore: this.codeQuestions.length,
      percentage: (this.calculateScore() / Math.max(1, this.codeQuestions.length)) * 100
    }
  }

  formatResult(): BaseQuizResult {
    return {
      type: this.type,
      score: this.calculateScore(),
      maxScore: this.codeQuestions.length,
      percentage: (this.calculateScore() / Math.max(1, this.codeQuestions.length)) * 100,
      answers: this.answers,
      questions: this.codeQuestions,
      completedAt: new Date().toISOString()
    }
  }
}
