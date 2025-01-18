import { prisma } from "@/lib/db";
import {
  DashboardUser,
  PrismaUser,
  PrismaUserQuiz,
  UserStats,
} from "../types";

class UserDashboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserDashboardError";
  }
}

async function fetchUserById(userId: string): Promise<DashboardUser | null> {
  const result= prisma.user.findUnique({
    where: { id: userId },
    include: {
      courses: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          slug: true,
          category: { select: { id: true, name: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
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
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { lastAccessedAt: "desc" },
        take: 5,
      },
      userQuizzes: {
        select: {
          id: true,
          topic: true,
          slug: true,
          timeStarted: true,
          timeEnded: true,
          gameType: true,
          score: true,
          duration: true,
          questions: { select: { id: true } },
        },
        orderBy: { timeStarted: "desc" },
        take: 5,
      },
      subscriptions: true,
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
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
      quizAttempts: {
        select: {
          id: true,
          quizId: true,
          score: true,
          timeSpent: true,
          createdAt: true,
          improvement: true,
          accuracy: true,
          QuizAttemptQuestion: {
            select: {
              id: true,
              questionId: true,
              userAnswer: true,
              isCorrect: true,
              timeSpent: true,
            },
          },
          quiz: {
            select: {
              id: true,
              chapterId: true,
              question: true,
              answer: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  return result;
}

function calculateQuizPercentageCorrect(quiz: PrismaUserQuiz): number {
  const totalQuestions = quiz.questions?.length ?? 0;
  const correctAnswers = quiz.score ?? 0;
  return totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
}

export async function getUserData(userId: string): Promise<DashboardUser | null> {
  try {
    const user = await fetchUserById(userId);
    if (!user) return null;

    const dashboardUser: DashboardUser = {
      ...user,
      userQuizzes: user.userQuizzes.map((quiz) => ({
        ...quiz,
        percentageCorrect: calculateQuizPercentageCorrect(quiz),
      })),
      courseProgress: user.courseProgress.map((progress) => ({
        ...progress,
        courseId: progress.course.id,
      })),
      favorites: user.favorites.map((favorite) => ({
        ...favorite,
        courseId: favorite.course.id,
      })),
    };

    return dashboardUser;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new UserDashboardError("Failed to fetch user data");
  }
}

async function fetchUserStatsData(userId: string) {
  return prisma.$transaction(async (tx) => {
    const [totalQuizzes, quizScores, completedCourses, totalTimeSpent] = await Promise.all([
      tx.userQuiz.count({ where: { userId } }),
      tx.userQuiz.findMany({
        where: { userId },
        select: { id: true, score: true, questions: { select: { id: true } } },
      }),
      tx.courseProgress.count({ where: { userId, isCompleted: true } }),
      tx.courseProgress.aggregate({
        where: { userId },
        _sum: { timeSpent: true },
      }),
    ]);

    return { totalQuizzes, quizScores, completedCourses, totalTimeSpent };
  });
}

function calculateQuizStats(quizScores: PrismaUserQuiz[]): { averageScore: number; highestScore: number } {
  const scores = quizScores.map((quiz) => {
    const totalQuestions = quiz.questions?.length ?? 0;
    const correctAnswers = quiz.score ?? 0;
    return totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
  });

  const averageScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const highestScore = scores.length ? Math.max(...scores) : 0;

  return { averageScore, highestScore };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const { totalQuizzes, quizScores, completedCourses, totalTimeSpent } = await fetchUserStatsData(userId);
    const { averageScore, highestScore } = calculateQuizStats(quizScores as PrismaUserQuiz[]);

    return {
      totalQuizzes,
      averageScore,
      highestScore,
      completedCourses,
      totalTimeSpent: totalTimeSpent._sum.timeSpent ?? 0,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw new UserDashboardError("Failed to fetch user stats");
  }
}
