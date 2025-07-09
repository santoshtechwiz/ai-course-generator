import { QuizType } from "@/app/types/quiz-types";
import { BaseQuizService } from "./base-quiz.service";
import { generateOpenEndedQuiz } from "@/lib/chatgpt/userMcqQuiz";

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
    return questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      hints: q.openEndedQuestion?.hints?.split("|") || [],
      difficulty: q.openEndedQuestion?.difficulty,
      tags: q.openEndedQuestion?.tags?.split("|") || [],
      type: 'openended',
    }));
  }
}
