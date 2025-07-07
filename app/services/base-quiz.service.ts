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
   * Get a quiz by its slug
   */
  async getQuizBySlug(slug: string, userId: string) {
    const quiz = await this.quizRepository.findBySlug(slug);
    
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    return {
      isPublic: quiz.isPublic,
      isFavorite: quiz.isFavorite,
      quizData: {
        id: quiz.id,
        title: quiz.title,
        questions: this.formatQuestions(quiz.questions),
      },
      userId: quiz.userId,
    };
  }

  /**
   * Update a quiz's properties (isPublic, isFavorite)
   */
  async updateQuizProperties(slug: string, userId: string, data: { isPublic?: boolean; isFavorite?: boolean }) {
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
   * Format questions based on quiz type (implemented by child classes)
   */
  protected abstract formatQuestions(questions: any[]): any[];
}
