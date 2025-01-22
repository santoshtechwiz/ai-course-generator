import type { User as PrismaUser } from "@prisma/client"

// Base types
export interface BaseEntity {
  id: string | number
  createdAt: Date
  updatedAt: Date
}

export type QuizType = "mcq" | "open-ended" | "fill-blanks"

// User related types
export interface DashboardUser extends PrismaUser {
  courses: Course[]
  courseProgress: CourseProgress[]
  userQuizzes: UserQuiz[]
  subscriptions: UserSubscription | null
  favorites: Favorite[]
  quizAttempts: UserQuizAttempt[]
  engagementScore: number
  streakDays: number
  lastStreakDate: Date | null
}

export interface UserEngagementMetrics extends BaseEntity {
  userId: string
  totalLoginTime: number
  averageSessionLength: number
  lastCalculated: Date
  weeklyActiveMinutes: number
  monthlyActiveMinutes: number
  completionRate: number
}

// Course related types
export interface Course extends BaseEntity {
  name: string
  description: string | null
  image: string
  viewCount: number
  totalRatings: number
  averageRating: number
  userId: string
  categoryId: number | null
  isCompleted: boolean | null
  isPublic: boolean
  slug: string | null
  difficulty: string | null
  estimatedHours: number | null
  category: Category | null
  courseUnits: CourseUnit[]
}

export interface CourseUnit extends BaseEntity {
  courseId: number
  name: string
  isCompleted: boolean | null
  duration: number | null
  order: number
  chapters: Chapter[]
}

export interface Chapter extends BaseEntity {
  unitId: number
  name: string
  youtubeSearchQuery: string
  videoId: string | null
  summary: string | null
  isCompleted: boolean
  summaryStatus: string
  videoStatus: string
  order: number
  courseQuizzes: CourseQuiz[]
}

export interface CourseProgress extends BaseEntity {
  userId: string
  courseId: number
  currentChapterId: number
  currentUnitId: number | null
  completedChapters: string
  progress: number
  lastAccessedAt: Date
  timeSpent: number
  isCompleted: boolean
  completionDate: Date | null
  quizProgress: string | null
  notes: string | null
  bookmarks: string | null
  lastInteractionType: string | null
  interactionCount: number
  engagementScore: number
  course: Course
}

export interface Category extends BaseEntity {
  name: string
  courses: Course[]
}

// Quiz related types
export interface UserQuiz extends BaseEntity {
  userId: string
  timeStarted: Date
  topic: string
  timeEnded: Date | null
  quizType: QuizType
  isPublic: boolean | null
  slug: string
  isFavorite: boolean | null
  lastAttempted: Date | null
  bestScore: number | null
  difficulty: string | null
  questions: UserQuizQuestion[]
  attempts: UserQuizAttempt[]
}

export interface UserQuizQuestion extends BaseEntity {
  userQuizId: number
  question: string
  answer: string
  options: string | null
  questionType: string
  openEndedQuestion: OpenEndedQuestion | null
}

export interface OpenEndedQuestion extends BaseEntity {
  questionId: number
  hints: string
  difficulty: string
  tags: string
}

export interface UserQuizAttempt extends BaseEntity {
  userId: string
  userQuizId: number
  score: number | null
  timeSpent: number | null
  improvement: number | null
  accuracy: number | null
  deviceInfo: string | null
  browserInfo: string | null
  completionSpeed: number | null
  difficultyRating: number | null
  attemptQuestions: UserQuizAttemptQuestion[]
}

export interface UserQuizAttemptQuestion extends BaseEntity {
  attemptId: number
  questionId: number
  userAnswer: string | null
  isCorrect: boolean | null
  timeSpent: number
}

export interface CourseQuiz extends BaseEntity {
  chapterId: number
  question: string
  answer: string
  options: string
  attempts: CourseQuizAttempt[]
}

export interface CourseQuizAttempt extends BaseEntity {
  userId: string
  courseQuizId: number
  score: number | null
  timeSpent: number | null
  improvement: number | null
  accuracy: number | null
}

// Other types
export interface UserSubscription extends BaseEntity {
  userId: string
  planId: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
}

export interface Favorite extends BaseEntity {
  userId: string
  courseId: number
  course: Course
}

export interface LearningPath extends BaseEntity {
  userId: string
  name: string
  description: string | null
  courses: Course[]
  isCompleted: boolean
  progress: number
}

export interface UserAchievement extends BaseEntity {
  userId: string
  achievementType: string
  achievedAt: Date
  metadata: any | null
  points: number
}

export interface ContentRecommendation extends BaseEntity {
  userId: string
  contentType: string
  contentId: string
  recommendedAt: Date
  reason: string | null
  relevanceScore: number
}

export interface UserInteraction extends BaseEntity {
  userId: string
  interactionType: string
  entityId: string
  entityType: string
  timestamp: Date
  metadata: any | null
  duration: number | null
}

// Stats and analytics types
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

export interface QuizAttempt {
  score: number
  totalQuestions: number
  percentageCorrect: number
  topic: string
  timeSpent: number
}

// Component prop types
export interface QuizCardProps {
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  questionCount: number
  isTrending?: boolean
  slug: string
  quizType: QuizType
  estimatedTime: string
}

export interface BadgeProps {
  text: string
  type: "difficulty" | "questions" | "trending"
}

// Error types
export class CourseAIErrors {
  constructor(
    public message: string,
    public code?: number,
  ) {}
}

