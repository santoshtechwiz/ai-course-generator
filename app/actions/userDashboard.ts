import { prisma } from "@/lib/db";
import { DashboardUser, UserStats } from "../types";

export async function getUserData(userId: string): Promise<DashboardUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        courseProgress: {
          select: {
            id: true,
            progress: true,
            currentChapterId: true,
            completedChapters: true,
            timeSpent: true,
            isCompleted: true,
            course: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                slug: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            lastAccessedAt: 'desc',
          },
          take: 5,
        },
        userQuizzes: {
          orderBy: { timeStarted: 'desc' },
          take: 5,
          select: {
            id: true,
            topic: true,
            slug: true,
            timeStarted: true,
            timeEnded: true,
            quizType: true,
            questions: {
              select: {
                id: true,
              },
            },
            bestScore: true
          },
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            planId: true,
            cancelAtPeriodEnd: true,
            stripeSubscriptionId: true,
          },
        },
        favorites: {
          select: {
            id: true,
            course: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                slug: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        userQuizAttempts: {
          select: {
            id: true,
            userQuizId: true,
            score: true,
            timeSpent: true,
            createdAt: true,
            improvement: true,
            accuracy: true,
            attemptQuestions: {
              select: {
                id: true,
                questionId: true,
                userAnswer: true,
                isCorrect: true,
                timeSpent: true,
              },
            },
            userQuiz: {
              select: {
                id: true,
                topic: true,
                questions: {
                  select: {
                    id: true,
                    question: true,
                    answer: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return null;
    }

    const dashboardUser: DashboardUser = {
      ...user,
      courses: user.courses,
      subscriptions: user.subscriptions,
      userQuizzes: user.userQuizzes.map(quiz => ({
        ...quiz,
        percentageCorrect: quiz.questions.length ? 0 : 0, // This needs to be calculated differently as we don't have a score field in UserQuiz
      })),
      courseProgress: user.courseProgress,
      favorites: user.favorites,
      quizAttempts: user.userQuizAttempts,
    };

    return dashboardUser;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('Failed to fetch user data');
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const [totalQuizzes, quizAttempts, completedCourses, totalTimeSpent] = await Promise.all([
        tx.userQuiz.count({
          where: { userId },
        }),
        tx.userQuizAttempt.findMany({
          where: { userId },
          select: {
            score: true,
            userQuiz: {
              select: {
                questions: {
                  select: { id: true },
                },
              },
            },
          },
        }),
        tx.courseProgress.count({
          where: {
            userId,
            isCompleted: true,
          },
        }),
        tx.courseProgress.aggregate({
          where: { userId },
          _sum: { timeSpent: true },
        }),
      ]);

      const scores = quizAttempts.map(attempt => {
        const totalQuestions = attempt.userQuiz.questions.length;
        return {
          score: attempt.score || 0,
          totalQuestions,
          percentageCorrect: totalQuestions ? (attempt.score || 0) / totalQuestions * 100 : 0,
        };
      });

      const averageScore = scores.length
        ? scores.reduce((acc, quiz) => acc + quiz.percentageCorrect, 0) / scores.length
        : 0;

      const highestScore = scores.length
        ? Math.max(...scores.map(quiz => quiz.percentageCorrect))
        : 0;

      return {
        totalQuizzes,
        averageScore,
        highestScore,
        completedCourses,
        totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
      };
    });

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user stats');
  }
}