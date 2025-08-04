import { BaseQuizService } from "./base-quiz.service";
import { generateQuestions } from "@/lib/chatgpt/generateQuestions";
import { generateSlug } from "@/lib/utils";

export class McqQuizService extends BaseQuizService {
    constructor() {
        super("mcq");
    }

    /**
     * Generate MCQ quiz using the existing generation logic
     */
    async generateQuiz(params: { amount: number; title: string; type?: string; difficulty?: string }) {
        const { amount, title, difficulty = "medium" } = params;
        
        try {
            // Use the existing generateQuestions function
            const questions = await generateQuestions({
                amount,
                title,
                type: "mcq",
                difficulty
            });

            return questions;
        } catch (error) {
            console.error("Error generating MCQ quiz:", error);
            throw new Error(`Failed to generate MCQ quiz: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    async generateMcqQuiz(userId: string, title: string, amount: number, difficulty: string) {
        return this.generateQuiz({ amount, title, difficulty });
    }

    /**
     * Get an MCQ quiz by its slug
     */
    async getQuizBySlug(slug: string, userId: string) {
        const result = await super.getQuizBySlug(slug, userId);
        return result;
    }

    protected formatQuestions(questions: any[]): any[] {
        return questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: JSON.parse(q.options || '[]'),
            correctAnswer: q.answer,
            type: 'mcq',
        }));
    }
}
