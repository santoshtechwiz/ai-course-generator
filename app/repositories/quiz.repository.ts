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
    // Handle favorites filtering with user-specific favorites
    if (favoritesOnly && userId) {
      // Get user's favorite quiz IDs first
      const favoriteQuizzes = await prisma.userQuizFavorite.findMany({
        where: { userId },
        select: { userQuizId: true }
      });
      
      const favoriteQuizIds = favoriteQuizzes.map(f => f.userQuizId);
      
      if (favoriteQuizIds.length === 0) {
        return []; // No favorites found
      }

      const where: any = {
        id: { in: favoriteQuizIds },
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

      // Handle public/private filtering for favorites
      if (!includePrivate) {
        where.isPublic = isPublic;
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

    // Regular listing (non-favorites)
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
   * Check if a user has favorited a specific quiz
   */
  async checkIfUserFavorited(slug: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    
    try {
      const quiz = await this.findBySlug(slug);
      if (!quiz) return false;

      // Check if user has favorited this quiz using the UserQuizFavorite table
      const favorite = await prisma.userQuizFavorite.findUnique({
        where: {
          userId_userQuizId: {
            userId,
            userQuizId: quiz.id
          }
        }
      });

      return !!favorite;
    } catch (error) {
      console.error('Error checking user favorite status:', error);
      return false;
    }
  }

  /**
   * Add quiz to user's favorites (user-specific)
   */
  async addToFavorite(slug: string, userId: string) {
    const quiz = await this.findBySlug(slug);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Allow any authenticated user to favorite any public quiz
    if (!quiz.isPublic && quiz.userId !== userId) {
      throw new Error("Cannot favorite private quiz unless you're the owner");
    }

    // Create a user-specific favorite entry
    try {
      await prisma.userQuizFavorite.create({
        data: {
          userId,
          userQuizId: quiz.id
        }
      });
      return quiz;
    } catch (error: any) {
      // If it's already favorited, that's fine - just return the quiz
      if (error.code === 'P2002') {
        return quiz;
      }
      throw error;
    }
  }

  /**
   * Remove quiz from user's favorites (user-specific)
   */
  async removeFromFavorite(slug: string, userId: string) {
    const quiz = await this.findBySlug(slug);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Remove the user-specific favorite entry
    await prisma.userQuizFavorite.deleteMany({
      where: {
        userId,
        userQuizId: quiz.id
      }
    });

    return quiz;
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
