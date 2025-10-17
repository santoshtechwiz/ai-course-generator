import { QuizType } from "../types/quiz-types";
import { QuizRepository } from "../repositories/quiz.repository";
import { QuestionRepository } from "../repositories/question.repository";
import { UserRepository } from "../repositories/user.repository";

/**
 * Base class for all quiz services with common functionality
 */
export abstract class BaseQuizService {
  protected quizRepository: QuizRepository;
  protected questionRepository: QuestionRepository;
  protected userRepository: UserRepository;
  protected quizType: QuizType;

  constructor(quizType: QuizType) {
    this.quizRepository = new QuizRepository();
    this.questionRepository = new QuestionRepository();
    this.userRepository = new UserRepository();
    this.quizType = quizType;
  }

  /**
   * Get a quiz by its slug with user-specific data
   */
  async getQuizBySlug(slug: string, userId: string) {
    try {
      const quiz = await this.quizRepository.findBySlug(slug);

      if (!quiz) {
        console.warn(`[${this.quizType}Service] Quiz not found: ${slug} for user ${userId}`);
        return null;
      }

      // Check if user has access to this quiz
      const isOwner = quiz.userId === userId;
      const hasAccess = isOwner || quiz.isPublic;
      
      if (!hasAccess) {
        console.warn(`[${this.quizType}Service] Unauthorized access attempt: ${slug} by user ${userId} (owner: ${quiz.userId})`);
        throw new Error("PRIVATE_QUIZ");
      }

      // Check if the current user has favorited this quiz
      let isFavorite = false;
      if (userId) {
        isFavorite = await this.quizRepository.checkIfUserFavorited(slug, userId);
      }

      console.log(`[${this.quizType}Service] Successfully retrieved quiz: ${slug} (${quiz.questions?.length || 0} questions) for user ${userId}`);

      return {
        isPublic: quiz.isPublic,
        isFavorite: isFavorite, // User-specific favorite status
        id: quiz.id,
        title: quiz.title,
        questions: this.formatQuestions(quiz.questions),
        userId: quiz.userId,
        language: quiz.language,
      };
    } catch (error) {
      console.error(`[${this.quizType}Service] Error retrieving quiz ${slug} for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Update a quiz's properties (isPublic, isFavorite)
   */
  async updateQuizProperties(
    slug: string,
    userId: string,
    data: { isPublic?: boolean; isFavorite?: boolean }
  ) {
    const quiz = await this.quizRepository.findBySlug(slug);

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (quiz.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return this.quizRepository.updateQuizProperties(slug, data);
  }

  /**
   * Mark a quiz as complete
   */
  async completeQuiz(slug: string, userId: string, score: number) {
    return this.quizRepository.markQuizComplete(slug, userId, score);
  }

  /**
   * Add quiz to favorites
   */
  async addToFavorite(slug: string, userId: string) {
    return this.quizRepository.addToFavorite(slug, userId);
  }

  /**
   * Remove quiz from favorites
   */
  async removeFromFavorite(slug: string, userId: string) {
    return this.quizRepository.removeFromFavorite(slug, userId);
  }

  /**
   * Toggle quiz visibility
   */
  async toggleVisibility(slug: string, userId: string) {
    return this.quizRepository.toggleVisibility(slug, userId);
  }

  async delete(slug: string, userId: string) {
    const quiz = await this.quizRepository.findBySlug(slug);
    
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    
    if (quiz.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    return this.quizRepository.deleteQuiz(quiz.id);
  }
  /**
   * Format questions based on quiz type (implemented by child classes)
   */
  protected abstract formatQuestions(questions: any[]): any[];
}
