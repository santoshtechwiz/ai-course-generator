import { QuizType } from "../types/quiz-types";
import { titleSubTopicToSlug } from "@/lib/slug";
import { generateCodingMCQs } from "../api/quizzes/code/generator";
import { BaseQuizService } from "./base-quiz.service";

/**
 * Service for handling code quiz operations
 */
export class CodeQuizService extends BaseQuizService {
  constructor() {
    super("code");
  }

  /**
   * Generate a new code quiz
   */
  async generateCodeQuiz(userId: string, language: string, title: string, difficulty: string, amount: number) {
    // Create a slug for the quiz
    const slug = titleSubTopicToSlug(language, title);
    
    // Create a new user quiz
    const userQuiz = await this.quizRepository.createUserQuiz(userId, `${language} ${title}`, "code", slug);

    try {
      // Generate questions using OpenAI
      let quizzes = await generateCodingMCQs(language, title, difficulty, amount);
      
      if (quizzes.length === 0) {
        throw new Error("No quizzes available for the selected topic");
      }

      // Randomize the order
      quizzes = quizzes.sort(() => 0.5 - Math.random());

      // Add difficulty to each quiz
      quizzes = quizzes.map((quiz) => ({ ...quiz, difficulty }));

      // Create questions in the database
      await this.questionRepository.createQuestions(quizzes, userQuiz.id, "code");

      // Update topic count
      await this.quizRepository.updateTopicCount(language);

      // Deduct user credits
      await this.userRepository.updateUserCredits(userId, "code");

      return {
        userQuizId: userQuiz.id,
        slug: userQuiz.slug,
      };
    } catch (error) {
      // Cleanup if anything fails
      await this.quizRepository.delete(userQuiz.id);
      throw error;
    }
  }
  /**
   * Format the questions for a code quiz
   */
  protected formatQuestions(questions: any[]): any[] {
    return questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      codeSnippet: q.codeSnippet,
      options: JSON.parse(q.options || '[]'),
      correctAnswer: q.answer,
      type: 'code',
    }));
  }

  /**
   * Get a code quiz by its slug
   */
  async getCodeQuizBySlug(slug: string, userId: string) {
    return this.getQuizBySlug(slug, userId);
  }

  /**
   * Update a code quiz's public/favorite status
   */
  async updateCodeQuizProperties(slug: string, userId: string, data: { isPublic?: boolean; isFavorite?: boolean }) {
    return this.updateQuizProperties(slug, userId, data);
  }

  /**
   * Mark a code quiz as complete
   */
  async completeCodeQuiz(slug: string, userId: string, score: number) {
    return this.completeQuiz(slug, userId, score);
  }
}
