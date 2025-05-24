
import type { QuizType } from "@/app/types/quiz-types"
import { BaseQuiz } from "./BaseQuiz"
import { BlanksQuiz } from "./BlanksQuiz"
import { CodeQuiz } from "./CodeQuiz"
import { MCQQuiz } from "./MCQQuiz"

export class QuizFactory {
  static createQuiz(type: QuizType, questions: any[] = []): BaseQuiz {
    switch(type) {
      case "code":
        return new CodeQuiz(questions)
      case "mcq":
        return new MCQQuiz(questions)
      case "blanks":
        return new BlanksQuiz(questions)
      default:
        throw new Error(`Invalid quiz type: ${type}`)
    }
  }
}
