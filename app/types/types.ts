import type { CourseRating, CourseUnit, Prisma, User } from "@prisma/client"

// Type definitions
export type UserType = "FREE" | "BASIC" | "PRO" | "PREMIUM" | "ULTIMATE"

export interface DashboardUser extends User {
  courses: Course[]
  courseProgress: CourseProgress[]
  userQuizzes: UserQuiz[]
  subscriptions: UserSubscription | null
  favorites: Favorite[]
  quizAttempts: UserQuizAttempt[]
  engagementScore: number
  streakDays: number
  lastStreakDate: Date | null
  credits: number
}

// Update the UserQuizAttempt interface to make userId optional
export interface UserQuizAttempt {
  id: number
  userId?: string // Make userId optional to match the actual data structure
  userQuizId: number
  score: number | null
  timeSpent: number | null
  improvement: number | null
  accuracy: number | null
  createdAt: Date
  updatedAt: Date
  attemptQuestions: {
    id: number
    questionId: number
    userAnswer: string | null
    isCorrect: boolean | null
    timeSpent: number
  }[]
  userQuiz: {
    id: number
    title: string
    questions: {
      id: number
      question: string
      answer: string
    }[]
  }
}

export type CourseCardProps = {
  title: string
  description: string
  rating: number
  slug: string
  unitCount: number
  lessonCount: number
  quizCount: number
  viewCount: number
  category?: string
  duration?: string
}

// Define CourseMetadata
export interface CourseMetadata {
  duration?: number
  difficulty?: string
  estimatedHours?: number | null
}

export interface Course extends CourseMetadata {
  id: number
  title: string
  description: string | null
  image: string
  slug: string | null
  courseUnits?: CourseUnit[]
  createdAt: Date
  updatedAt?: Date
  viewCount?: number
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
  timeEnded: Date | null
  quizType: string
  questions: { id: number; question: string; answer: string }[]
  bestScore: number | null
  attempts: { score: number | null }[]
  percentageCorrect: number
  totalAttempts: number
  isPublic?: boolean
}

export interface UserSubscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  planId: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
  stripeCustomerId?: string | null
}

export interface Favorite {
  id: number
  course: Course
  userId?: string
  courseId?: number
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

export interface CourseDetails {
  id: number
  title: string
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
  videoId: string | null
  chapterId?: number
  description: string | null
  title: string
  order: number | null
  courseId?: number
  isCompleted: boolean
  questions: CourseQuestion[]
  summary: string | null
  chapter?: FullChapterType
}

export type CourseQuestion = {
  id: number
  question: string
  options: string[] | string
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
  questions: Prisma.UserQuizQuestionGetPayload<{}>[]
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

export type QuizType = "mcq" | "openended" | "fill-blanks" | "code" | "flashcard" | "undefined"

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
  title: string
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
  title: string
  isCompleted: boolean | null
  chapters: FullChapter[]
  duration?: number | null
  order?: number | null
}

export interface FullChapter {
  id: number
  title: string
  videoId: string | null
  order: number | null
  isCompleted: boolean | null
  summary: string | null
  description: string | null
  questions: CourseQuestion[]
  unitId?: number
  summaryStatus?: string
  videoStatus?: string
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
  quizProgress: any | null
  notes: string | null
  bookmarks: string | null
  lastInteractionType: string | null
  interactionCount: number
  engagementScore: number
  createdAt?: Date
  updatedAt?: Date
  course?: {
    id: number
    title: string
    description: string | null
    image: string
    slug: string | null
    createdAt: Date
    updatedAt: Date
    courseUnits?: {
      id: number
      name: string
      chapters: {
        id: number
        title: string
      }[]
    }[]
    category?: {
      id: number
      name: string
    }
  }
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
  id?: string | number
  question: string
  answer: string
  userId?: string
  quizId?: string | number
  userQuizId?: number
  createdAt?: Date
  updatedAt?: Date
  isSaved?: boolean
  saved?: boolean
  difficulty?: string | null
  slug?: string | null
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
