import { QuizType } from "@/app/types/quiz-types";
import { BaseQuizService } from "./base-quiz.service";
import { generateOpenEndedQuiz } from "@/lib/chatgpt/userMcqQuiz";
import { generateContentAwareHints } from "@/lib/utils/hint-system";

export class OpenEndedQuizService extends BaseQuizService {
  constructor() {
    super("openended");
  }

  /**
   * Generate OpenEnded quiz using the existing generation logic
   */
  async generateQuiz(params: { title: string; amount: number; difficulty?: string; userType?: string }) {
    const { title, amount, difficulty = "medium", userType = "FREE" } = params;

    try {
      // Use the existing generateOpenEndedQuiz function
      const quiz = await generateOpenEndedQuiz(title, amount, difficulty, userType);

      return quiz;
    } catch (error) {
      console.error("Error generating open-ended quiz:", error);
      throw new Error(`Failed to generate open-ended quiz: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateOpenEndedQuiz(userId: string, title: string, amount: number, difficulty: string) {
    return this.generateQuiz({ title, amount, difficulty });
  }

  protected formatQuestions(questions: any[]): any[] {
    return questions.map((q: any) => {
      // Extract DB-provided hints and tags (may be empty/null)
      const dbHints: string[] = q.openEndedQuestion?.hints?.split("|")?.map((h: string) => h.trim()).filter(Boolean) || [];
      const dbTags: string[] = q.openEndedQuestion?.tags?.split("|")?.map((t: string) => t.trim()).filter(Boolean) || [];

      // If no DB hints are available, generate content-aware hints from the question
      const generatedHints = generateContentAwareHints(
        q.question || '',
        q.openEndedQuestion?.keywords?.split('|')?.map((k: string) => k.trim()).filter(Boolean) || [],
        'medium',
        undefined,
        { maxHints: 3, tags: dbTags }
      ).map((h: any) => h.content || '');

      const hints = dbHints.length > 0 ? dbHints : generatedHints;

      return {
        id: q.id,
        question: q.question,
        answer: q.answer,
        hints,
        tags: dbTags,
        type: 'openended',
      };
    });
  }
}
