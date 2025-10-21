import { BaseQuizService } from "./base-quiz.service";
import { generateFillInBlanks } from "@/lib/ai/course-ai-service";

export class BlanksQuizService extends BaseQuizService {
  constructor() {
    super("blanks");
  }

  /**
   * Generate Blanks quiz using simple AI service
   */
  public async generateQuiz(params: {
    title: string;
    amount: number;
    userType?: string;
    userId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    credits?: number;
  }) {
    const { title, amount, userType = "FREE", userId, difficulty = 'medium', credits } = params;

    try {
      const quiz = await generateFillInBlanks(
        title,
        amount,
        difficulty,
        userId,
        userType as any,
        credits
      );

      return quiz;
    } catch (error) {
      console.error("Error generating blanks quiz:", error);
      throw new Error(
        `Failed to generate blanks quiz: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateBlanksQuiz(
    userId: string,
    title: string,
    amount: number,
    difficulty: string
  ) {
    return this.generateQuiz({ title, amount });
  }

  /**
   * Get a blanks quiz by its slug
   */
  async getQuizBySlug(slug: string, userId: string) {
    try {
      const quiz = await this.quizRepository.findBySlug(slug);

      if (!quiz) {
        console.warn(`[blanksService] Quiz not found: ${slug} for user ${userId}`);
        return null;
      }

      // Check if user has access to this quiz
      const isOwner = quiz.userId === userId;
      const hasAccess = isOwner || quiz.isPublic;
      
      if (!hasAccess) {
        console.warn(`[blanksService] Unauthorized access attempt: ${slug} by user ${userId} (owner: ${quiz.userId})`);
        throw new Error("PRIVATE_QUIZ");
      }

      // Check if the current user has favorited this quiz
      let isFavorite = false;
      if (userId) {
        isFavorite = await this.quizRepository.checkIfUserFavorited(slug, userId);
      }

      console.log(`[blanksService] Successfully retrieved quiz: ${slug} (${quiz.questions?.length || 0} questions) for user ${userId}`);

      return {
        isPublic: quiz.isPublic,
        isFavorite: isFavorite,
        id: quiz.id,
        title: quiz.title,
        questions: this.formatQuestions(quiz.questions),
        userId: quiz.userId,
        language: quiz.language,
      };
    } catch (error) {
      console.error(`[blanksService] Error retrieving quiz ${slug} for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Format questions for the blanks quiz
   */
  protected formatQuestions(questions: any[]): any[] {
    return questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      type: "blanks",
      tags: q.openEndedQuestion?.tags?.split("|") || [],
      hints: q.openEndedQuestion?.hints?.split("|") || [],
    }));
  }
}
