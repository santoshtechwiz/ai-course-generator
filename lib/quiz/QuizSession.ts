import type { BaseQuiz } from "./BaseQuiz"
import type { UserAnswer } from "@/app/types/quiz-types"

export class QuizSession {
  private quiz: BaseQuiz
  private currentQuestionIndex: number
  private readonly timeLimit?: number

  constructor(quiz: BaseQuiz, timeLimit?: number) {
    this.quiz = quiz
    this.currentQuestionIndex = 0
    this.timeLimit = timeLimit
  }

  submitAnswer(answer: UserAnswer): void {
    if (this.quiz.validateAnswer(answer.answer)) {
      // Add answer and move to next question
      this.quiz.addAnswer(answer)
      this.currentQuestionIndex++
    }
  }

  getCurrentQuestion() {
    return this.quiz.getQuestion(this.currentQuestionIndex)
  }

  isComplete(): boolean {
    return this.currentQuestionIndex >= this.quiz.getQuestionCount()
  }

  getResult() {
    if (!this.isComplete()) {
      throw new Error("Quiz is not complete")
    }
    return this.quiz.formatResult()
  }
}
