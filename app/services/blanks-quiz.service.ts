import { BaseQuizService } from "./base-quiz.service";
import { generateOpenEndedFillIntheBlanks } from "@/lib/chatgpt/userMcqQuiz";

export class BlanksQuizService extends BaseQuizService {
  constructor() {
    super("blanks");
  }

  /**
   * Generate Blanks quiz using the existing generation logic
   */
  async generateQuiz(params: {
    title: string;
    amount: number;
    userType?: string;
  }) {
    const { title, amount, userType = "FREE" } = params;

    try {
      // Use the existing generateOpenEndedFillIntheBlanks function
      const quiz = await generateOpenEndedFillIntheBlanks(
        title,
        amount,
        userType
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
    const quiz = await this.quizRepository.findBySlug(slug);

    // If quiz not found or not accessible, throw an error
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Check if quiz is accessible (public or owned by user)
    if (!quiz.isPublic && quiz.userId !== userId) {
      throw new Error("Quiz not accessible");
    }

    const result = {
      isPublic: quiz.isPublic,
      isFavorite: quiz.isFavorite,
      slug: quiz.slug,
      id: quiz.id,
      title: quiz.title,
      questions: this.formatQuestions(quiz.questions),
      userId: quiz.userId,
    };

    console.log("Blanks Quiz found:", result);
    return result;
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
