import { User } from "@prisma/client"

export interface DashboardUser extends User {
  courses: Course[]
  courseProgress: CourseProgress[]
  userQuizzes: UserQuiz[]
  subscriptions: UserSubscription[]
  favorites: Favorite[]
  quizAttempts: UserQuizAttempt[]
  engagementScore: number
  streakDays: number
  lastStreakDate: Date | null
}

export interface Course {
  id: number
  name: string
  description: string | null
  image: string
  slug: string | null
  courseUnits?: CourseUnit[]
  category?: {
    id: number
    name: string
  }
}

export interface CourseUnit {
  id: number
  name: string
  chapters: Chapter[]
}

export interface Chapter {
  id: number
  name: string
  questions?: CourseQuiz[]
}

export interface CourseProgress {
  id: number
  progress: number
  currentChapterId: number
  completedChapters: string
  timeSpent: number
  isCompleted: boolean
  lastAccessedAt: Date
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
  bestScore: number | null
  attempts: { score: number | null }[]
  percentageCorrect: number
}

export interface UserSubscription {
  id: number
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

export interface UserQuizAttempt {
  id: number
  userQuizId: number
  score: number | null
  timeSpent: number | null
  createdAt: Date
  improvement: number | null
  accuracy: number | null
  attemptQuestions: AttemptQuestion[]
  userQuiz: {
    id: number
    topic: string
    questions: {
      id: number
      question: string
      answer: string
    }[]
  }
}

export interface AttemptQuestion {
  id: number
  questionId: number
  userAnswer: string | null
  isCorrect: boolean | null
  timeSpent: number | null
}

export interface UserStats {
  totalQuizzes: number
  totalAttempts: number
  averageScore: number
  highestScore: number
  completedCourses: number
  totalTimeSpent: number
  averageTimePerQuiz: number
  topPerformingTopics: TopicPerformance[]
  recentImprovement: number
  quizzesPerMonth: number
  courseCompletionRate: number
  consistencyScore: number
  learningEfficiency: number
  difficultyProgression: number
}

export interface TopicPerformance {
  topic: string
  averageScore: number
  attempts: number
  averageTimeSpent: number
}

export interface CourseQuiz {
  id: number
  question: string
  answer: string
}
export interface RandomQuizProps{

  
}