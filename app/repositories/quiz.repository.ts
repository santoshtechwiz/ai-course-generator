import { QuizType } from "@/app/types/quiz-types";
import prisma from "@/lib/db";
import { BaseRepository } from "./base.repository";
import { titleSubTopicToSlug } from "@/lib/slug";

/**
 * Repository for handling quiz data operations
 */
export class QuizRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.userQuiz);
  }
  /**
   * Find a quiz by its slug
   */
  async findBySlug(slug: string) {
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        questions: {
          include: {
            openEndedQuestion: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });
    if (!quiz) {
      return null;
    }
    return quiz;
  }


  /**
   * Create a new quiz
   */
  async createUserQuiz(userId: string, title: string, quizType: QuizType, slug: string) {
    return prisma.userQuiz.create({
      data: {
        userId,
        title,
        quizType,
        slug,
        timeStarted: new Date(),
      },
    });
  }

  /**
   * Update quiz properties
   */
  async updateQuizProperties(slug: string, data: { isPublic?: boolean; isFavorite?: boolean }) {
    return prisma.userQuiz.update({
      where: { slug },
      data,
    });
  }

  /**
   * Delete a quiz by ID
   */
  async deleteQuiz(id: number) {
    return prisma.userQuiz.delete({
      where: { id },
    });
  }

  /**
   * List quizzes with optional filtering
   */
  async listQuizzes({
    limit = 10,
    quizType,
    search,
    userId,
    isPublic = true,
    includePrivate = false,
    favoritesOnly = false,
  }: {
    limit?: number;
    quizType?: string;
    search?: string;
    userId?: string;
    isPublic?: boolean;
    includePrivate?: boolean;
    favoritesOnly?: boolean;
  }) {
    const where: any = {
      ...(quizType ? { quizType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // Handle public/private filtering
    if (!includePrivate) {
      where.isPublic = isPublic;
    }

    // If user ID is provided, filter by user's quizzes
    if (userId) {
      where.userId = userId;
      
      // If favorites only, filter by favorites
      if (favoritesOnly) {
        where.isFavorite = true;
      }
    }

    return prisma.userQuiz.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  }

  /**
   * Get a random quiz
   */
  async getRandomQuiz(quizType?: string) {
    const where: any = { isPublic: true };
    if (quizType) {
      where.quizType = quizType;
    }

    const count = await prisma.userQuiz.count({ where });
    const skip = Math.floor(Math.random() * count);

    const quiz = await prisma.userQuiz.findFirst({
      where,
      skip,
      include: {
        questions: true,
      },
    });

    return quiz;
  }
  /**
   * Mark a quiz as complete
   */
  async markQuizComplete(slug: string, userId: string, score: number) {
    const quiz = await this.findBySlug(slug);
    
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    return prisma.userQuiz.update({
      where: { id: quiz.id },
      data: {
        timeEnded: new Date(),
        bestScore: score,
      },
    });
  }

  /**
   * Get quiz completion status
   */
  async getQuizCompletionStatus(slug: string, userId: string) {
    const quiz = await this.findBySlug(slug);
    
    if (!quiz) {
      return null;
    }

    if (quiz.timeEnded) {
      return {
        userQuizId: quiz.id,
        userId,
        score: quiz.bestScore,
        completedAt: quiz.timeEnded
      };
    }

    return null;
  }

  /**
   * Update topic count
   */
  async updateTopicCount(topic: string) {
    return prisma.topicCount.upsert({
      where: { topic },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        topic,
        count: 1,
      },
    });
  }

  /**
   * Add quiz to favorites
   */
  async addToFavorite(slug: string, userId: string) {
    const quiz = await this.findBySlug(slug);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    if (quiz.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return prisma.userQuiz.update({
      where: { slug },
      data: { isFavorite: true },
    });
  }

  /**
   * Remove quiz from favorites
   */
  async removeFromFavorite(slug: string, userId: string) {
    const quiz = await this.findBySlug(slug);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    if (quiz.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return prisma.userQuiz.update({
      where: { slug },
      data: { isFavorite: false },
    });
  }

  /**
   * Toggle quiz visibility (public/private)
   */
  async toggleVisibility(slug: string, userId: string) {
    const quiz = await this.findBySlug(slug);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    if (quiz.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return prisma.userQuiz.update({
      where: { slug },
      data: { isPublic: !quiz.isPublic },
    });
  }
}
