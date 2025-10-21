import { BaseRepository } from "./base.repository";
import prisma from "@/lib/db";

/**
 * Repository for handling ordering quiz data operations
 */
export class OrderingQuizRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.orderingQuiz);
  }

  /**
   * Find an ordering quiz by its slug
   * Fails fast - no retries or similar slug lookups
   */
  async findBySlug(slug: string) {
    console.log(`[OrderingQuizRepository] Looking for quiz with slug: "${slug}"`);
    try {
      const quiz = await prisma.orderingQuiz.findUnique({
        where: { slug },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
          },
          attempts: {
            where: {
              userId: undefined, // Will be filtered by service layer
            },
            orderBy: {
              completedAt: 'desc',
            },
            take: 1, // Get latest attempt
          },
        },
      });

      if (quiz) {
        console.log(`[OrderingQuizRepository] Quiz found: ID: ${quiz.id}, Title: ${quiz.title}`);
      } else {
        console.log(`[OrderingQuizRepository] Quiz not found for slug: "${slug}"`);
      }

      return quiz || null;
    } catch (error) {
      console.error(`[OrderingQuizRepository] Error finding quiz with slug "${slug}":`, error);
      throw error;
    }
  }

  /**
   * Create a new ordering quiz with questions
   */
  async createOrderingQuiz(
    userId: string,
    title: string,
    description: string,
    topic: string,
    difficulty: string,
    slug: string,
    questions: Array<{
      title: string;
      description?: string;
      steps: Array<{
        id: number;
        description: string;
        explanation?: string;
      }>;
      correctOrder: number[];
      orderIndex: number;
    }>
  ) {
    console.log(`[OrderingQuizRepository] Creating quiz with slug: "${slug}", title: "${title}", questions count: ${questions.length}`);
    try {
      const result = await prisma.orderingQuiz.create({
        data: {
          slug,
          title,
          description,
          topic,
          difficulty,
          createdBy: userId,
          questions: {
            create: questions.map(q => ({
              title: q.title,
              description: q.description,
              steps: q.steps,
              correctOrder: q.correctOrder,
              orderIndex: q.orderIndex,
            })),
          },
        },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      console.log(`[OrderingQuizRepository] Quiz created successfully with ID: ${result.id}, slug: "${result.slug}"`);
      return result;
    } catch (error) {
      console.error(`[OrderingQuizRepository] Error creating quiz with slug "${slug}":`, error);
      throw error;
    }
  }

  /**
   * Update quiz properties
   */
  async updateQuizProperties(slug: string, data: { isPublic?: boolean }) {
    return prisma.orderingQuiz.update({
      where: { slug },
      data,
    });
  }

  /**
   * Delete an ordering quiz by ID
   */
  async deleteQuiz(id: number) {
    return prisma.orderingQuiz.delete({
      where: { id },
    });
  }

  /**
   * List ordering quizzes with optional filtering
   */
  async listQuizzes({
    limit = 10,
    search,
    userId,
    isPublic = true,
    includePrivate = false,
    difficulty,
  }: {
    limit?: number;
    search?: string;
    userId?: string;
    isPublic?: boolean;
    includePrivate?: boolean;
    difficulty?: string;
  }) {
    const where: any = {};

    // Public/private filtering
    if (!includePrivate) {
      where.isPublic = isPublic;
    }

    // User filtering
    if (userId) {
      where.createdBy = userId;
    }

    // Difficulty filtering
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Search filtering
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.orderingQuiz.findMany({
      where,
      include: {
        questions: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(userId: string, quizId?: number) {
    const where: any = { userId };
    if (quizId) {
      where.orderingQuizId = quizId;
    }

    return prisma.orderingQuizAttempt.findMany({
      where,
      include: {
        orderingQuiz: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }

  /**
   * Create a quiz attempt
   */
  async createAttempt(
    userId: string,
    orderingQuizId: number,
    score: number,
    correctAnswers: number,
    totalQuestions: number,
    timeSpent: number
  ) {
    return prisma.orderingQuizAttempt.create({
      data: {
        userId,
        orderingQuizId,
        score,
        correctAnswers,
        totalQuestions,
        timeSpent,
      },
    });
  }

  /**
   * Create question attempts for a quiz attempt
   */
  async createQuestionAttempts(
    attemptId: number,
    questionAttempts: Array<{
      questionId: number;
      userAnswer: number[];
      isCorrect: boolean;
      timeSpent: number;
    }>
  ) {
    return prisma.orderingQuizAttemptQuestion.createMany({
      data: questionAttempts.map(qa => ({
        attemptId,
        questionId: qa.questionId,
        userAnswer: qa.userAnswer,
        isCorrect: qa.isCorrect,
        timeSpent: qa.timeSpent,
      })),
    });
  }
}