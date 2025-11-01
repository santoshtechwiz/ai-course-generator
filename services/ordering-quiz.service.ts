import { OrderingQuizRepository } from "@/app/repositories/ordering-quiz.repository";
import { generateOrderingQuiz } from "@/lib/ai/course-ai-service";
import { generateUniqueSlug } from "@/lib/utils/string";
import { creditService, CreditOperationType } from "@/services/credit-service";
import { getAuthSession } from "@/lib/auth";
import type { SubscriptionPlanType } from "@/types/subscription-plans";

interface OrderingQuizData {
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  steps: Array<{
    id: number;
    description: string;
    explanation?: string;
  }>;
}

interface CreateOrderingQuizParams {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  userId: string;
  userType?: string;
  credits?: number;
  numberOfQuestions?: number;
}

/**
 * Service for handling ordering quiz operations
 */
class OrderingQuizService {
  private repository: OrderingQuizRepository;

  constructor() {
    this.repository = new OrderingQuizRepository();
  }

  /**
   * Create a new ordering quiz
   */
  async createQuiz(params: CreateOrderingQuizParams) {
    const { topic, difficulty, userId, userType = 'FREE', credits = 0, numberOfQuestions = 3 } = params;

    // Generate quiz content using AI
    const quizData = await generateOrderingQuiz(
      topic,
      difficulty,
      userId,
      userType as SubscriptionPlanType,
      credits,
      numberOfQuestions
    );

    // Generate unique slug (only checks OrderingQuiz table)
    const slug = await generateUniqueSlug(topic, 'ordering');

    // Prepare questions data - quizData.questions should now contain multiple ordering questions
    const questions = quizData.questions.map((question: any, index: number) => ({
      title: question.title || `Question ${index + 1}`,
      description: question.description || '',
      // Store steps as JSON array with id, description, explanation
      steps: Array.isArray(question.steps) 
        ? question.steps.map((step: any, stepIndex: number) => ({
            id: step.id ?? stepIndex,
            description: step.description || '',
            explanation: step.explanation || '',
          }))
        : [],
      // Create correct order array: [0, 1, 2, 3, ...] for initial shuffle
      correctOrder: Array.isArray(question.steps)
        ? question.steps.map((_: any, stepIndex: number) => stepIndex)
        : [],
      orderIndex: index + 1,
    }));

    // Validate we have questions
    if (questions.length === 0) {
      throw new Error('Failed to generate valid ordering quiz questions');
    }

    // Create quiz in database
    const createdQuiz = await this.repository.createOrderingQuiz(
      userId,
      `${topic} - Ordering Quiz`, // Overall quiz title
      `${numberOfQuestions} ordering questions about ${topic}`, // Overall quiz description
      topic,
      difficulty,
      slug,
      questions
    );

    return {
      ...createdQuiz,
      slug,
    };
  }

  /**
   * Create a quiz with credit deduction (for API routes)
   */
  async createQuizWithCredits(params: CreateOrderingQuizParams) {
    const { userId } = params;

    // SECURE: Atomic credit validation and deduction
    const creditDeduction = 1; // Standard 1 credit per quiz
    const creditResult = await creditService.executeCreditsOperation(
      userId,
      creditDeduction,
      CreditOperationType.QUIZ_CREATION,
      {
        description: `ordering quiz creation: ${params.topic}`,
        quizType: "ordering",
        difficulty: params.difficulty,
      }
    );

    if (!creditResult.success) {
      throw new Error(creditResult.error || "Insufficient credits");
    }

    try {
      // Create the quiz
      const quiz = await this.createQuiz(params);

      return {
        ...quiz,
        creditsRemaining: creditResult.newBalance,
        transactionId: creditResult.transactionId,
      };
    } catch (error) {
      // Refund credits if quiz creation fails
      await creditService.executeCreditsOperation(
        userId,
        -creditDeduction,
        CreditOperationType.REFUND,
        {
          description: `Refund for failed ordering quiz generation: ${params.topic}`,
          originalTransactionId: creditResult.transactionId,
        }
      );
      throw error;
    }
  }

  /**
   * Find a quiz by slug
   */
  async findBySlug(slug: string) {
    return this.repository.findBySlug(slug);
  }

  /**
   * List quizzes with filtering
   */
  async listQuizzes(options: {
    limit?: number;
    search?: string;
    userId?: string;
    isPublic?: boolean;
    includePrivate?: boolean;
    difficulty?: string;
  }) {
    return this.repository.listQuizzes(options);
  }

  /**
   * Submit a quiz attempt
   */
  async submitQuiz(
    userId: string,
    slug: string,
    answers: Array<{
      questionId: number;
      userAnswer: number[];
      timeSpent: number;
    }>
  ) {
    // Find the quiz
    const quiz = await this.repository.findBySlug(slug);
    if (!quiz) {
      throw new Error(`Ordering quiz not found with slug: ${slug}`);
    }

    // Calculate score
    let correctAnswers = 0;
    let totalTime = 0;

    const questionAttempts = answers.map(answer => {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) {
        throw new Error(`Question not found: ${answer.questionId}`);
      }

      // Check if answer is correct
      const correctOrder = Array.isArray(question.correctOrder) ? question.correctOrder : [];
      const isCorrect = JSON.stringify(answer.userAnswer) === JSON.stringify(correctOrder);

      if (isCorrect) {
        correctAnswers++;
      }

      totalTime += answer.timeSpent;

      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        timeSpent: answer.timeSpent,
      };
    });

    const percentageScore = quiz.questions.length > 0
      ? Math.round((correctAnswers / quiz.questions.length) * 100)
      : 0;

    // Create attempt record
    const attempt = await this.repository.createAttempt(
      userId,
      quiz.id,
      percentageScore,
      correctAnswers,
      quiz.questions.length,
      Math.round(totalTime / 1000) // Convert to seconds
    );

    // Create question attempts
    await this.repository.createQuestionAttempts(attempt.id, questionAttempts);

    return {
      attempt,
      score: percentageScore,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent: totalTime,
    };
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(userId: string, quizId?: number) {
    return this.repository.getUserAttempts(userId, quizId);
  }

  /**
   * Update quiz properties
   */
  async updateQuizProperties(slug: string, data: { isPublic?: boolean }) {
    return this.repository.updateQuizProperties(slug, data);
  }

  /**
   * Delete a quiz by slug (compatible with quiz service factory interface)
   */
  async delete(slug: string, userId: string) {
    const quiz = await this.repository.findBySlug(slug);
    
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    
    if (quiz.createdBy !== userId) {
      throw new Error("Unauthorized");
    }
    
    return this.repository.deleteQuiz(quiz.id);
  }

  /**
   * Delete a quiz by id (legacy method)
   */
  async deleteQuiz(id: number) {
    return this.repository.deleteQuiz(id);
  }
}

// Export both the class and singleton instance
export { OrderingQuizService };
export const orderingQuizService = new OrderingQuizService();