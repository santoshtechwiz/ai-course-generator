// User-related types
import { QuizType } from "./quiz-types"

// User dashboard data
export interface DashboardUser {
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
export interface UserStats {
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
export interface Course {
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
export interface CourseUnit {
  id: string
  title: string
  chapters?: Chapter[]
}

// Chapter structure
export interface Chapter {
  id: string
  title: string
}

// Course progress
export interface CourseProgress {
  id: string
  progress: number
  currentChapterId?: string
  completedChapters?: string[]
  timeSpent?: number
  isCompleted: boolean
  lastAccessedAt?: Date
  course?: Course
}

// User quiz
export interface UserQuiz {
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
export interface UserSubscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  planId: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string
  stripeCustomerId: string
}

// Favorite
export interface Favorite {
  id: string
  course?: Course
}

// User quiz attempt
export interface UserQuizAttempt {
  id: string
  userId: string
  userQuizId: number
  score: number
  timeSpent: number
  createdAt: Date
  updatedAt: Date
  improvement?: number
  accuracy?: number
  attemptQuestions?: AttemptQuestion[]
  userQuiz?: {
    id: number
    title: string
    questions?: any[]
  }
}

// Attempt question
export interface AttemptQuestion {
  id: number
  questionId: number
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
}

// Topic performance
export interface TopicPerformance {
  topic: string
  averageScore: number
  attempts: number
  averageTimeSpent: number
  difficulty?: string
}
