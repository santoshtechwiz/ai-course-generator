import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()
import { writeFileSync } from 'fs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_BACKUP as string
    }
  }
})

async function main() {
  console.log('Starting export of all data from DATABASE_URL_BACKUP...');

  // Export all data with relations
  const users = await prisma.user.findMany({
    include: {
      accounts: true,
      courses: true,
      courseProgress: true,
      courseQuizAttempts: true,
      ratings: true,
      favorites: true,
      flashCards: true,
      PendingSubscription: true,
      sessions: true,
      TokenTransaction: true,
      engagementMetrics: true,
      userQuizzes: true,
      userQuizAttempts: true,
      userQuizRatings: true,
      UserReferral: true,
      referralsReceived: true,
      referralsGiven: true,
      subscription: true
    }
  });

  const accounts = await prisma.account.findMany({
    include: {
      user: true
    }
  });

  const sessions = await prisma.session.findMany({
    include: {
      user: true
    }
  });

  const courses = await prisma.course.findMany({
    include: {
      category: true,
      user: true,
      courseProgress: true,
      ratings: true,
      courseUnits: {
        include: {
          chapters: {
            include: {
              courseQuizzes: true
            }
          }
        }
      },
      favorites: true
    }
  });

  const courseUnits = await prisma.courseUnit.findMany({
    include: {
      chapters: true,
      course: true
    }
  });

  const chapters = await prisma.chapter.findMany({
    include: {
      courseQuizzes: true,
      unit: {
        include: {
          course: true
        }
      }
    }
  });

  const courseRatings = await prisma.courseRating.findMany({
    include: {
      course: true,
      user: true
    }
  });

  const categories = await prisma.category.findMany({
    include: {
      courses: true
    }
  });

  const courseProgress = await prisma.courseProgress.findMany({
    include: {
      course: true,
      user: true
    }
  });

  const userSubscriptions = await prisma.userSubscription.findMany({
    include: {
      user: true
    }
  });

  const favorites = await prisma.favorite.findMany({
    include: {
      course: true,
      user: true
    }
  });

  const topicCounts = await prisma.topicCount.findMany();

  const courseQuizzes = await prisma.courseQuiz.findMany({
    include: {
      chapter: true,
      attempts: {
        include: {
          user: true
        }
      }
    }
  });

  const courseQuizAttempts = await prisma.courseQuizAttempt.findMany({
    include: {
      courseQuiz: true,
      user: true
    }
  });

  const userQuizzes = await prisma.userQuiz.findMany({
    include: {
      user: true,
      attempts: {
        include: {
          user: true
        }
      },
      questions: {
        include: {
          openEndedQuestion: true,
          attemptQuestions: true
        }
      },
      userQuizRating: true,
      flashCards: true,
      openEndedQuestions: true
    }
  });

  const userQuizAttempts = await prisma.userQuizAttempt.findMany({
    include: {
      user: true,
      userQuiz: true,
      attemptQuestions: true
    }
  });

  const userEngagementMetrics = await prisma.userEngagementMetrics.findMany({
    include: {
      user: true
    }
  });

  const userQuizQuestions = await prisma.userQuizQuestion.findMany({
    include: {
      userQuiz: true,
      openEndedQuestion: true,
      attemptQuestions: true
    }
  });

  const openEndedQuestions = await prisma.openEndedQuestion.findMany({
    include: {
      question: true,
      userQuiz: true
    }
  });

  const userQuizAttemptQuestions = await prisma.userQuizAttemptQuestion.findMany({
    include: {
      attempt: true,
      question: true
    }
  });

  const userQuizRatings = await prisma.userQuizRating.findMany({
    include: {
      user: true,
      userQuiz: true
    }
  });

  const flashCards = await prisma.flashCard.findMany({
    include: {
      user: true,
      userQuiz: true
    }
  });

  const userAchievements = await prisma.userAchievement.findMany();

  const userNotifications = await prisma.userNotification.findMany();

  const courseTags = await prisma.courseTag.findMany({
    include: {
      courses: true
    }
  });

  const courseToTags = await prisma.courseToTag.findMany({
    include: {
      tag: true
    }
  });

  const userSettings = await prisma.userSettings.findMany();

  const tokenTransactions = await prisma.tokenTransaction.findMany({
    include: {
      user: true
    }
  });

  const userReferrals = await prisma.userReferral.findMany({
    include: {
      user: true,
      referralUses: true
    }
  });

  const userReferralUses = await prisma.userReferralUse.findMany({
    include: {
      referral: true,
      referred: true,
      referrer: true
    }
  });

  const contactSubmissions = await prisma.contactSubmission.findMany();

  const pendingSubscriptions = await prisma.pendingSubscription.findMany({
    include: {
      user: true
    }
  });

  // Write all data to a single JSON file
  const allData = {
    users,
    accounts,
    sessions,
    courses,
    courseUnits,
    chapters,
    courseRatings,
    categories,
    courseProgress,
    userSubscriptions,
    favorites,
    topicCounts,
    courseQuizzes,
    courseQuizAttempts,
    userQuizzes,
    userQuizAttempts,
    userEngagementMetrics,
    userQuizQuestions,
    openEndedQuestions,
    userQuizAttemptQuestions,
    userQuizRatings,
    flashCards,
    userAchievements,
    userNotifications,
    courseTags,
    courseToTags,
    userSettings,
    tokenTransactions,
    userReferrals,
    userReferralUses,
    contactSubmissions,
    pendingSubscriptions
  };

  writeFileSync('prisma/all-data.json', JSON.stringify(allData, null, 2));
  console.log('Export completed! All data saved to prisma/all-data.json');
}

main().finally(() => prisma.$disconnect())
