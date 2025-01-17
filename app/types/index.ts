import { IconType } from "react-icons"
import { Course as PrismaCourse, UserQuiz } from "@prisma/client"

// Base Types
export interface BaseEntity {
  id: string | number
  createdAt?: Date
  updatedAt?: Date
}

// Quiz Types
export type QuizType = 'mcq' | 'open_ended'

export interface QuizCreationData {
  topic: string
  type: QuizType
  amount: number
  difficulty: string
}

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

export interface GameQuestion {
  id: number
  question: string
  answer: string
  options: string[] | null
  gameId: number
}

export interface Game {
  id: number
  gameType: QuizType
  timeStarted: Date
  userId: string
  topic: string
  questions: GameQuestion[]
}

// Course Types
export interface CourseDetails {
  id: number
  courseName: string
  totalUnits: number
  totalChapters: number
  category: string | null
  slug: string
}

export interface CourseProps {
  id: string
  name: string
  description: string
  image: string
  rating: number
  slug: string
  level?: number
  unitCount: number
  lessonCount: number
  quizCount: number
  userId: string
}

export interface MultipleChoiceQuestion {
  question: string
  correctAnswer: string
  incorrectAnswers: string[]
}

export interface Question extends BaseEntity {
  text: string
  options: string[]
  correctOption: number
  answer: string
  chapterId: number
  type: QuizType
}

export interface RequestBody {
  videoId: string
  chapterId: number
  chapterName: string
}

export interface RandomQuizProps {
  id: number
  topic: string
  totalQuestions: number
  slug: string
}

export interface Quiz extends BaseEntity {
  id: string // Override as string
  topic: string
  gameType: QuizType
  isPublic: boolean
  timeStarted: string
  questionCount: number
  slug: string
  questions: Question[]
}

export interface QuizAttempt extends BaseEntity {
  userId: string
  quizId: string
  score: number
  answers: Record<string, string>
  user: User
  quiz: Question
}

// Course Structure Types
export interface Chapter extends BaseEntity {
  name: string
  description?: string
  videoId?: string
  position: number
  isPublished: boolean
  isFree: boolean
  courseUnitId: number
  questions: (Question & {
    attempts: QuizAttempt[]
  })[]
}

export interface CourseUnit extends BaseEntity {
  name: string
  description?: string
  position: number
  courseId: number
  chapters: Chapter[]
}

// Progress Types
export interface Progress {
  courseId: number
  currentChapterId: number | null
  completedChapters: number[]
  progress: number
}


export interface CourseProgress extends BaseEntity {
  userId: number
  courseId: number
  completedChapters: number[];

  quizScores: Record<string, number>
  bookmarks: string[]
  currentChapterId?: number
  currentUnitId?: number
  isCompleted?: boolean
  progress: number
  lastAccessedAt?: Date
  timeSpent?: number
  notes?: string
  user: User
}

// Subscription Types
export type UserSubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | null

export interface Subscription {
  id: string
  status: UserSubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  planId: string
  cancelAtPeriodEnd: boolean
}

// List Types
export interface CoursesListProps {
  courseData: CourseProps[]
}

// API Response Types
export interface YoutubeSearchResponse {
  items: Array<{
    id: {
      videoId: string
    }
  }>
}

export interface TranscriptResponse {
  status: number
  message: string
  transcript?: string
}

export interface TranscriptItem {
  text: string
}

export interface TranscriptEntry {
  text: string
}

// User Types
export interface UserStats {
  totalQuizzes: number
  averageScore: number
  highestScore: number
  completedCourses: number
  totalTimeSpent: number
  totalCoursesWatched?: number
  totalQuizzesAttempted?: number
}

export interface User extends BaseEntity {
  id: string // Override as string
  name: string
  email: string
  image: string
  credits: number
  userType: string
}

export interface UserData extends User {
  courses: PrismaCourse[]
  userQuizzes: Quiz[]
  subscriptions: Subscription | null
  favorites: UserFavorite[]
}

export interface DashboardUser extends User {
  totalCoursesWatched: number
  totalQuizzesAttempted: number
  totalTimeSpent: number
  courses: PrismaCourse[]
  subscriptions: Subscription | null
  userQuizzes: UserQuiz[]
  courseProgress: CourseProgress[]
  favorites: UserFavorite[]
}

// Category Types
export interface Category {
  id: string
  name: string
}

export interface CourseBase {
  id: string
  name: string
  description: string
  image: string
  slug: string
  category: Category
}

// Navigation Types
export interface NavItem {
  name: string
  href: string
  icon: IconType
  subItems: NavSubItem[]
}

export interface NavSubItem {
  name: string
  href: string
}

// Progress Update Types
export interface ProgressUpdate {
  completedChapters?: string[]
  currentChapterId?: number
  currentUnitId?: number
  progress?: number
  timeSpent?: number
  isCompleted?: boolean

  quizScores?: { [key: string]: number }
  notes?: string
  bookmarks?: { chapterId: number; timestamp: number; note: string }[]
}

// User Interaction Types
export interface UserFavorite {
  id: string
  course: Pick<CourseBase, 'id' | 'name' | 'slug' | 'image'>
}

// Course Full Types
export interface Course extends BaseEntity {
  name: string
  description?: string
  imageUrl?: string
  price: number
  isPublished: boolean
  userId: string
  slug: string
  courseUnits: CourseUnit[]
  courseProgress: CourseProgress[]
  category?: Category
  rating?: number
  level?: number
}

// Error Types
export class CourseAIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CourseAIError"
  }
}

// Type Aliases for backwards compatibility
export type FullChapterType = Chapter
export type FullCourseType = Course & {
  courseUnits: (CourseUnit & {
    chapters: (Chapter & {
      questions: (Question & {
        attempts: QuizAttempt[]
      })[]
    })[]
  })[]
}

export class CourseAIErrors{
  constructor(message: string) {
    this.message = message
  }

  message: string
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'course' | 'quiz';
  slug: string;
}

export interface SearchResponse {
  courses: SearchResult[];
  quizzes: SearchResult[];
}

