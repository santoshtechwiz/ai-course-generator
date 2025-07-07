import { CodeQuizService } from "@/app/services/code-quiz.service";
import { QuizType } from "@/app/types/quiz-types";

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
      // Add other quiz type services as they are implemented
      default:
        return new CodeQuizService(); // Default to code quiz for now
    }
  }
}
