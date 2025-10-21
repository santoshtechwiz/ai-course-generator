import { BaseQuizService } from "./base-quiz.service";
import { generateSlug } from "@/lib/utils";
import { generateMCQ } from "@/lib/ai/course-ai-service";

export class McqQuizService extends BaseQuizService {
    constructor() {
        super("mcq");
    }

    /**
     * Generate MCQ quiz using the simple AI service
     */
    public async generateQuiz(params: { amount: number; title: string; type?: string; difficulty?: string; userId?: string; userType?: string; credits?: number }) {
        const { amount, title, difficulty = "medium", userId, userType = "FREE", credits } = params;
        
        try {
            const questions = await generateMCQ(
                title,
                amount,
                difficulty as 'easy' | 'medium' | 'hard',
                userId,
                userType as any,
                credits
            );
            
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
        try {
            const result = await super.getQuizBySlug(slug, userId);
            return result;
        } catch (error) {
            // Re-throw PRIVATE_QUIZ errors for proper error handling
            if (error instanceof Error && error.message === "PRIVATE_QUIZ") {
                throw error;
            }
            console.error(`[mcqService] Error retrieving quiz ${slug} for user ${userId}:`, error);
            return null;
        }
    }

    protected formatQuestions(questions: any[]): any[] {
        return questions.map((q: any) => {
            try {
                const parsedOptions = JSON.parse(q.options || '[]')
                return {
                    id: q.id,
                    question: q.question,
                    options: Array.isArray(parsedOptions) ? parsedOptions : [],
                    correctAnswer: q.answer,
                    type: 'mcq',
                }
            } catch (error) {
                console.error('Error parsing options for question:', q.id, error)
                return {
                    id: q.id,
                    question: q.question,
                    options: [],
                    correctAnswer: q.answer,
                    type: 'mcq',
                }
            }
        });
    }
}
