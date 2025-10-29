// User-related types
import { QuizType } from "./quiz-types"

// User dashboard data
interface DashboardUser {
  id: string
  name?: string
  email?: string
  image?: string
  credits: number
  isAdmin?: boolean
  courses: Course[]
  subscriptions: UserSubscription | null
  userQuizzes: UserQuiz[]
  courseProgress: CourseProgress[]
  favorites: Favorite[]
  quizAttempts: UserQuizAttempt[]
  engagementScore: number
  streakDays: number
  lastStreakDate: Date | null
}

// User stats
interface UserStats {
  totalQuizzes: number
  totalAttempts: number
  averageScore: number
  highestScore: number
  completedCourses: number
  totalCourses: number
  totalTimeSpent: number
  averageTimePerQuiz: number
  topPerformingTopics: TopicPerformance[]
  recentImprovement: number
  quizzesPerMonth: number
  courseCompletionRate: number
  consistencyScore: number
  learningEfficiency: number
  difficultyProgression: number
  averageAccuracy?: number
  streakDays?: number
  engagementScore?: number
  quizTypeDistribution?: Record<string, number>
  learningPatterns?: {
    morningQuizzes: number
    afternoonQuizzes: number
    eveningQuizzes: number
    nightQuizzes: number
  }
  strengthAreas?: string[]
  improvementAreas?: string[]
}

// Course structure
interface Course {
  id: string
  title: string
  description?: string
  image?: string
  slug: string
  category?: {
    id: string
    name: string
  }
  courseUnits?: CourseUnit[]
  createdAt?: Date
  updatedAt?: Date
}

// Course unit
interface CourseUnit {
  id: string
  title: string
  chapters?: Chapter[]
}

// Chapter structure
interface Chapter {
  id: string
  title: string
}

// Full chapter type for course page
interface FullChapterType extends Chapter {
  content?: string
  videoUrl?: string
  questions?: CourseQuestion[]
  duration?: number
}

// Full course type for course page
interface FullCourseType extends Course {
  chapters?: FullChapterType[]
  courseUnits?: CourseUnit[]
  difficulty?: string
}

// Course question type
interface CourseQuestion {
  id: string
  question: string
  options?: string[]
  answer: string
  explanation?: string
}

// Course progress
interface CourseProgress {
  id: string
  progress: number
  currentChapterId?: string
  completedChapters?: string[]
  timeSpent?: number
  isCompleted: boolean
  lastAccessedAt?: Date
  course?: Course
  courseId?: string
}

// User quiz
interface UserQuiz {
  id: string
  title: string
  slug: string
  quizType: QuizType
  timeStarted: string
  timeEnded?: string
  percentageCorrect: number
  totalAttempts: number
  questions?: any[]
  bestScore?: number
}

// User subscription
interface UserSubscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  planId: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string
  stripeCustomerId: string
  userId?: string
}

// Favorite
interface Favorite {
  id: string
  course?: Course
}

// User quiz attempt
interface UserQuizAttempt {
  id: string | number
  userId: string
  userQuizId: number
  score?: number
  timeSpent?: number
  improvement?: number
  accuracy?: number
  createdAt: Date
  updatedAt: Date
  attemptQuestions?: AttemptQuestion[]
  userQuiz?: {
    id: number
    title: string
    quizType?: string
    difficulty?: string
    questions?: {
      id: number
      question: string
      answer: string
      questionType?: string
      openEndedQuestion?: {
        hints: string[]
        difficulty: string
        tags: string[]
      }
    }[]
  }
}

// Attempt question
interface AttemptQuestion {
  id: number
  questionId: number
  userAnswer?: string
  isCorrect?: boolean
  timeSpent: number
}

// Topic performance
interface TopicPerformance {
  topic: string
  title?: string
  averageScore: number
  attempts: number
  averageTimeSpent: number
  difficulty?: string
}

// Common query parameters
interface QueryParams {
  [key: string]: string | string[] | undefined
  title?: string
  amount?: string
  category?: string
}

// User type for admin management
export type UserType = "FREE" | "BASIC" | "PREMIUM" | "ULTIMATE"

// User with transactions for admin
interface UserWithTransactions {
  id: string
  name: string
  email: string
  credits: number
  transactions: any[]
  subscription?: UserSubscription
}

// Quiz list item for quiz listing
interface QuizListItem {
  id: string
  title: string
  quizType: QuizType
  isPublic: boolean
  isFavorite: boolean
  timeStarted: string
  slug: string
  questionCount: number
  bestScore?: number
}
