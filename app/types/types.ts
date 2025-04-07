import type { CourseRating, CourseUnit, Prisma, User, UserQuizAttempt, UserQuizQuestion } from "@prisma/client"
// Type definitions
export type UserType = "FREE" | "BASIC" | "PRO" | "PREMIUM" | "ULTIMATE"

export interface DashboardUser extends User {
  courses: Course[]
  courseProgress: CourseProgress[]
  userQuizzes: UserQuiz[]
  subscriptions: UserSubscription
  favorites: Favorite[]
  quizAttempts: UserQuizAttempt[]
  engagementScore: number
  streakDays: number
  lastStreakDate: Date | null
}



export interface CourseCardProps {
  id: string
  title: string // Renamed from name to title
  description: string
  image: string
  rating: number
  slug: string
  unitCount: number
  lessonCount: number
  quizCount: number
  userId: string
  viewCount: number
  category?: string
}

// Define or import CourseMetadata
export interface CourseMetadata {
  duration?: number
  difficulty?: string
}

export interface Course extends CourseMetadata {
  id: number
  title: string // Renamed from name to title
  description: string | null
  image: string
  slug: string | null
  courseUnits?: CourseUnit[]
  createdAt: Date
  updatedAt?: Date // Added missing field
  category?: {
    id: number
    name: string
  }
}

export interface UserQuiz {
  id: number
  title: string
  slug: string
  timeStarted: Date
  createdAt: Date
  timeEnded: Date | null
  quizType: string
  questions: { id: number; question?: string; answer?: string }[] // Enhanced type
  bestScore: number | null
  attempts: { score: number | null }[]
  percentageCorrect: number
  isPublic?: boolean // Added missing field
}

export interface UserSubscription {
  id: string // Changed to string to match schema
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  planId: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
  stripeCustomerId?: string | null // Added missing field
}

export interface Favorite {
  id: number
  course: Course
  userId?: string // Added missing field
  courseId?: number // Added missing field
}


export interface UserStats {
  totalQuizzes: number
  totalAttempts: number
  averageScore: number
  highestScore: number
  completedCourses: number
  totalTimeSpent: number
  averageTimePerQuiz: number
  topPerformingTopics: TopicPerformance[] // Renamed from topPerformingtitles to topPerformingTopics
  recentImprovement: number
  quizzesPerMonth: number
  courseCompletionRate: number
  consistencyScore: number
  learningEfficiency: number
  difficultyProgression: number
}

export interface TopicPerformance {
  // Renamed from titlePerformance to TopicPerformance
  title: string // Renamed from title to topic
  averageScore: number
  attempts: number
  averageTimeSpent: number
}

export interface CourseDetails {
  id: number
  title: string // Renamed from courseName to title
  category: string
  totalChapters: number
  totalUnits: number
  slug: string
}

export class CourseAIErrors {
  constructor(public message: string) {}
}

export interface FullChapterType {
  id: number
  videoId: string
  chapterId?: number // Made optional
  description: string
  title: string // Renamed from name to title
  order: number
  courseId?: number // Made optional
  isCompleted: boolean
  questions: CourseQuestion[]
  summary: string
  chapter?: FullChapterType // Made optional, recursive reference
}

export type CourseQuestion = {
  id: number
  question: string
  options: string[] | string // Fixed to allow string or string[]
  answer: string
}

export type Question = {
  id: number
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

export interface QuizCardProps {
  title: string
  questionCount: number
  isTrending: boolean
  slug: string
  quizType: string
  estimatedTime?: string
  description: string
}

export type QuizWithQuestionsAndTags = Prisma.UserQuizGetPayload<{
  include: {
    questions: true
  }
}>

export interface QuizListItem {
  id: number
  title: string
  slug: string
  questionCount: number
  questions: UserQuizQuestion[]
  isPublic: boolean
  quizType: string
  tags: string[]
  difficulty?: string
  bestScore?: number | null
  lastAttempted?: Date | null
}



export interface MultipleChoiceQuestion {
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

export interface OpenEndedQuestion {
  question: string
  answer: string
}

export type QuizType = "mcq" | "openended" | "fill-blanks" | "code" | "flashcard" |"undefined"

export interface CodeChallenge {
  question: string
  codeSnippet?: string
  language?: string
  options: string | string[]
  correctAnswer: string
}



export interface CodingQuizProps {
  isFavorite: boolean
  isPublic: boolean
  slug: string
  quizId: number
  userId?: string
  ownerId?: string
  quizData: {
    title: string
    questions: CodeChallenge[]
  }
}


export interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface FullCourseType {
  id: number
  title: string // Renamed from name to title
  description: string | null
  image: string
  viewCount: number
  userId: string
  categoryId: number | null
  isCompleted: boolean | null
  isPublic: boolean
  slug: string | null
  difficulty: string | null
  estimatedHours: number | null
  category: {
    id: number
    name: string
  } | null
  ratings: CourseRating[]
  courseUnits: FullCourseUnit[]
  courseProgress: CourseProgress[]
  createdAt: Date
  updatedAt: Date
}



export interface FullCourseUnit {
  id: number
  courseId: number
  title: string // Renamed from name to title
  isCompleted: boolean | null
  chapters: FullChapter[]
  duration?: number | null // Added missing field
  order?: number | null // Added missing field
}

export interface FullChapter {
  id: number
  title: string // Renamed from name to title
  videoId: string | null
  order: number | null
  isCompleted: boolean | null
  summary: string | null
  description: string | null
  questions: CourseQuestion[]
  unitId?: number // Added missing field
  summaryStatus?: string // Added missing field
  videoStatus?: string // Added missing field
}

export interface CourseProgress {
  id: number
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
  quizProgress: any | null // Changed from string to any for JSON compatibility
  notes: string | null
  bookmarks: string | null
  lastInteractionType: string | null
  interactionCount: number
  engagementScore: number
  createdAt?: Date // Added missing field
  updatedAt?: Date // Added missing field
}


export interface QuestionOpenEnded {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string
    difficulty: string
    tags: string
    inputType: string
  }
}

export interface TranscriptResponse {
  status: number
  message: string
}

export interface QueryParams {
  title?: string
  categoryAttachment?: string
  [key: string]: string | undefined
}

export interface QuizWrapperProps {
  type: QuizType
  queryParams?: QueryParams
}

export interface FlashCard {
  id?: string | number // Changed to allow both string and number
  question: string
  answer: string
  userId?: string
  quizId?: string | number // Changed to allow both string and number
  userQuizId?: number // Added to match schema
  createdAt?: Date
  updatedAt?: Date // Added missing field
  isSaved?: boolean
  saved?: boolean // Added to match schema
  difficulty?: string | null // Added missing field
  slug?: string | null // Added missing field
}





export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  response: string | null
  adminNotes: string | null
  createdAt: Date
  updatedAt: Date
}


export interface UserWithTransactions extends User {
  transactions: {
    id: string
    amount: number
    status: string
    createdAt: Date
  }[]
}

//subscription

