import { QuizType } from "../types/quiz-types"

/**
 * Interface defining the methods that all quiz services should implement
 * This is a future-facing interface for when we consolidate the quiz services
 */
export interface IQuizService {
  /**
   * Get the type of quiz this service handles
   */
  getQuizType(): QuizType

  /**
   * Generate a new quiz
   * @param userId The ID of the user creating the quiz
   * @param params Parameters for quiz generation
   */
  generateQuiz(
    userId: string,
    params: {
      title: string
      amount: number
      difficulty?: string
      language?: string
      userType?: string
      [key: string]: any
    }
  ): Promise<any>

  /**
   * Get a quiz by its slug
   * @param slug The slug of the quiz
   * @param userId The ID of the user requesting the quiz (for access control)
   */
  getQuizBySlug(slug: string, userId: string): Promise<any>

  /**
   * Update a quiz's properties
   * @param slug The slug of the quiz to update
   * @param userId The ID of the user making the update
   * @param data The properties to update
   */
  updateQuizProperties(
    slug: string,
    userId: string,
    data: { isPublic?: boolean; isFavorite?: boolean; [key: string]: any }
  ): Promise<any>

  /**
   * Complete a quiz and record the score
   * @param slug The slug of the quiz
   * @param userId The ID of the user completing the quiz
   * @param score The score achieved
   */
  completeQuiz(slug: string, userId: string, score: number): Promise<any>

  /**
   * Delete a quiz
   * @param slug The slug of the quiz
   * @param userId The ID of the user deleting the quiz (for access control)
   */
  deleteQuiz(slug: string, userId: string): Promise<void>

  /**
   * Format questions based on quiz type
   * @param questions The questions to format
   */
  formatQuestions(questions: any[]): any[]
}
