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
            lastAccessedAt: true,
            course: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                slug: true,
                courseUnits: {
                  select: {
                    id: true,
                    name: true,
                    chapters: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
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
            bestScore: true,
            attempts: {
              select: {
                score: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
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
        percentageCorrect: quiz.attempts[0]?.score !== undefined ? 
          (quiz.attempts[0].score / quiz.questions.length) * 100 : 0,
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
      // Fetch all user quiz attempts with related quiz information
      const quizAttempts = await tx.userQuizAttempt.findMany({
        where: { userId },
        include: {
          userQuiz: {
            select: {
              topic: true,
              questions: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Calculate basic stats
      const totalQuizzes = new Set(quizAttempts.map(a => a.userQuizId)).size;
      const totalAttempts = quizAttempts.length;
      const totalTimeSpent = quizAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

      // Calculate scores and topic performance
      const scores = quizAttempts.map(attempt => ({
        score: attempt.score || 0,
        totalQuestions: attempt.userQuiz.questions.length,
        percentageCorrect: attempt.userQuiz.questions.length ? 
          (attempt.score || 0) / attempt.userQuiz.questions.length * 100 : 0,
        topic: attempt.userQuiz.topic,
        timeSpent: attempt.timeSpent || 0,
      }));

      const averageScore = scores.length ? 
        scores.reduce((acc, quiz) => acc + quiz.percentageCorrect, 0) / scores.length : 0;
      const highestScore = scores.length ? 
        Math.max(...scores.map(quiz => quiz.percentageCorrect)) : 0;

      // Calculate topic performance
      const topicPerformance = scores.reduce((acc, score) => {
        if (!acc[score.topic]) {
          acc[score.topic] = { totalScore: 0, attempts: 0 };
        }
        acc[score.topic].totalScore += score.percentageCorrect;
        acc[score.topic].attempts += 1;
        return acc;
      }, {});

      const topPerformingTopics = Object.entries(topicPerformance)
        .map(([topic, data]) => ({
          topic,
          averageScore: data.totalScore / data.attempts,
          attempts: data.attempts,
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);

      // Calculate recent improvement (last 5 attempts vs previous 5)
      const recentAttempts = quizAttempts.slice(-10);
      const recentImprovement = recentAttempts.length >= 10 ?
        (recentAttempts.slice(5).reduce((sum, a) => sum + (a.score || 0), 0) / 5) -
        (recentAttempts.slice(0, 5).reduce((sum, a) => sum + (a.score || 0), 0) / 5) : 0;

      // Calculate quizzes per month
      const monthsSinceFirstQuiz = quizAttempts.length ?
        (new Date().getTime() - new Date(quizAttempts[0].createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000) : 1;
      const quizzesPerMonth = totalQuizzes / monthsSinceFirstQuiz;

      // Fetch completed courses
      const completedCourses = await tx.courseProgress.count({
        where: {
          userId,
          isCompleted: true,
        },
      });

      return {
        totalQuizzes,
        totalAttempts,
        averageScore,
        highestScore,
        completedCourses,
        totalTimeSpent,
        averageTimePerQuiz: totalAttempts ? totalTimeSpent / totalAttempts : 0,
        topPerformingTopics,
        recentImprovement,
        quizzesPerMonth,
      };
    });

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user stats');
  }
}