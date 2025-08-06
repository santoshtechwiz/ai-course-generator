import { CodeQuizService } from "@/app/services/code-quiz.service";
import { QuizType } from "@/app/types/quiz-types";
import { OpenEndedQuizService } from "@/app/services/openended-quiz.service";
import { BlanksQuizService } from "./blanks-quiz.service";
import { McqQuizService } from "./mcq-quiz.service";
import { FlashcardService } from "./flashcard.service";

/**
 * Factory for creating quiz services based on quiz type
 */
export class QuizServiceFactory {
  /**
   * Get the appropriate quiz service based on quiz type
   */
  static getQuizService(type?: QuizType | string) {
    switch (type) {
      case "code":
        return new CodeQuizService();
      case "mcq":
        return new McqQuizService();
      case "blanks":
        return new BlanksQuizService();
      case "openended":
        return new OpenEndedQuizService();
      case "flashcard":
        return new FlashcardService();
      // Add other quiz type services as they are implemented
      default:
        return new CodeQuizService(); // Default to code quiz for now
    }
  }
}
