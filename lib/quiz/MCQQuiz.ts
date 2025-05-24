import { BaseQuiz } from "./BaseQuiz"
import type { BaseQuizPreview, BaseQuizResult } from "@/app/types/quiz-base"
import type { MCQQuestion } from "@/app/types/quiz-types"

export class MCQQuiz extends BaseQuiz {
  private mcqQuestions: MCQQuestion[]

  constructor(questions: MCQQuestion[] = []) {
    super("mcq")
    this.mcqQuestions = questions
    this.questions = questions
  }

  validateAnswer(answer: string): boolean {
    if (!answer || typeof answer !== "string") return false
    const currentQuestion = this.questions[this.answers.length]
    return currentQuestion?.correctAnswer === answer
  }

  calculateScore(): number {
    return this.getCorrectAnswersCount()
  }

  generatePreview(): BaseQuizPreview {
    const score = this.calculateScore()
    return {
      type: this.type,
      score,
      maxScore: this.questions.length,
      percentage: (score / Math.max(1, this.questions.length)) * 100
    }
  }

  formatResult(): BaseQuizResult {
    const score = this.calculateScore()
    return {
      type: this.type,
      score,
      maxScore: this.questions.length,
      percentage: (score / Math.max(1, this.questions.length)) * 100,
      answers: this.answers,
      questions: this.questions,
      completedAt: new Date().toISOString()
    }
  }
}
