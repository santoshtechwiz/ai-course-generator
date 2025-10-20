import { QuizType } from "@/app/types/quiz-types";
import { BaseQuizService } from "./base-quiz.service";
import { generateHints } from "@/lib/utils/hint-system-unified";
import { generateOpenEnded } from "@/lib/ai/simple-ai-service";

export class OpenEndedQuizService extends BaseQuizService {
  constructor() {
    super("openended");
  }

  /**
   * Generate OpenEnded quiz using simple AI service
   */
  async generateQuiz(params: { title: string; amount: number; difficulty?: string; userType?: string; userId?: string }) {
    const { title, amount, difficulty = "medium", userType = "FREE", userId } = params;

    try {
      const quiz = await generateOpenEnded(
        title,
        amount,
        difficulty as 'easy' | 'medium' | 'hard',
        userId,
        userType as any
      );

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
      // Check for hints in multiple possible locations
      let dbHints: string[] = [];
      if (q.hints && Array.isArray(q.hints)) {
        // Direct hints array (from API response)
        dbHints = q.hints;
      } else if (q.openEndedQuestion?.hints) {
        // Pipe-separated hints from database
        dbHints = q.openEndedQuestion.hints.split("|").map((h: string) => h.trim()).filter(Boolean);
      }

      const dbTags: string[] = q.openEndedQuestion?.tags?.split("|")?.map((t: string) => t.trim()).filter(Boolean) || [];

      // If no DB hints are available, generate content-aware hints from the question
      const keywords = q.openEndedQuestion?.keywords?.split('|')?.map((k: string) => k.trim()).filter(Boolean) || [];
      const generatedHints = generateHints(
        q.answer || '',
        q.question || '',
        {
          tags: dbTags,
          keywords: keywords,
          expectedLength: 'medium'
        },
        undefined, // No user answer for hint generation
        { maxHints: 5 } // Increased from 3 for open-ended questions
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
