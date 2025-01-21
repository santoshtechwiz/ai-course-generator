import { User } from "@prisma/client"

// Types for Course, UserStats, etc.
export interface BaseEntity {
  id: string | number
  createdAt?: Date
  updatedAt?: Date
}

export type QuizType = 'multiple_choice' | 'open_ended' | 'fill_in_the_blank'

export interface MCQQuestion {
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

export interface OpenEndedQuestion {
  question: string
  answer: string
  hints: string
  difficulty: string
  tags: string
}

export interface TopicPerformance {
  topic: string
  averageScore: number
  attempts: number
}

export interface DashboardUser extends User {
  courses: Course[]
  courseProgress: CourseProgress[]
  userQuizzes: UserQuiz[]
  subscriptions: UserSubscription | null
  favorites: Favorite[]
  quizAttempts: QuizAttempt[]
}

export interface Course {
  id: number
  name: string
  description: string | null
  image: string
  slug: string | null
  createdAt: Date
  updatedAt: Date
  category: {
    id: number
    name: string
  } | null
}

export interface CourseProgress {
  id: number
  progress: number
  currentChapterId: number
  completedChapters: string
  timeSpent: number
  isCompleted: boolean
  course: Course
}

export interface UserQuiz {
  id: number
  topic: string
  slug: string
  timeStarted: Date
  timeEnded: Date | null
  quizType: string
  questions: { id: number }[]
  createdAt: Date
  updatedAt: Date
}

export interface UserSubscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  planId: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
}

export interface Favorite {
  id: number
  course: Course
}

export interface QuizAttempt {
  id: number
  quizId: number
  score: number | null
  timeSpent: number | null
  createdAt: Date
  improvement: number | null
  accuracy: number | null
  attemptQuestions: {
    id: number
    questionId: number
    userAnswer: string | null
    isCorrect: boolean | null
    timeSpent: number
  }[]
  quiz: {
    id: number
    chapterId: number
    question: string
    answer: string
  }
}

export interface RandomQuizProps {
  // Empty or customized for future use
}

export class CourseAIErrors {
  constructor(public message: string, public code?: number) {}
}

export interface QuizCardProps {
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  questionCount: number
  isTrending?: boolean
  slug: string
  quizType: string
  estimatedTime: string
}

export interface BadgeProps {
  text: string
  type: 'difficulty' | 'questions' | 'trending'
}
