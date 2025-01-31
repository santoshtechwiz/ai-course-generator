import { Prisma, User, UserQuizQuestion } from "@prisma/client"

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
  courseUnits?: CourseUnit[],
  createdAt: Date
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
  completedChapters: string|string[]
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
  createdAt: Date
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
export interface CourseDetails{

  id:number,
  courseName:string,
  category:string,
  totalChapters:number,
  totalUnits:number,
  slug:string
}
export class CourseAIErrors{
  constructor(public message:string){}
}

export interface FullChapterType {
  id: number;
  name: string;
  description?: string;
  videoId?: string;
  content?: string;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  courseUnitId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseUnitType {
  id: number;
  name: string;
  order: number;
  courseId: number;
  chapters: FullChapterType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FullCourseType {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  isPublished: boolean;
  categoryId?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  courseUnits?: CourseUnitType[];
  
  slug?: string;
}
export type Question = {
  id: number;
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
}

export interface QuizCardProps {
  title: string;
  questionCount: number;
  isTrending: boolean;
  slug: string;
  quizType: string;
  estimatedTime?: string;
  description: string;
}
export type QuizWithQuestionsAndTags = Prisma.UserQuizGetPayload<{
  include: {
    questions: true
    
  }
}>

export interface QuizListItem {
  id: number
  topic: string
  slug: string
  questionCount: number
  questions: UserQuizQuestion[]
  isPublic: boolean
  quizType: string
  tags: string[]
}
export interface CreateQuizCardConfig {
  title?: string
  description?: string
  createUrl?: string
  animationDuration?: number
  className?: string
}

export interface MultipleChoiceQuestion{
  question:string;
  answer:string;
  option1:string;
  option2:string;
  option3:string;

}
export interface OpenEndedQuestion{

  question:string;
  answer:string;

}
export enum QuizType{

  MultipleChoice = 'mcq',
  OpenEnded = 'openended',
  Code='code',
  FillInTheBlanks='fillintheblanks'
}

export interface CodeChallenge  {
  question: string
  codeSnippet?: string
  language?: string
  options: string
  correctAnswer: string
}


export interface QuizQuestion {
  question: string
  options: string
  codeSnippet: string | null
}

export interface CodingQuizProps {
  quizData: {
    title: string
    questions: QuizQuestion[]
  }
}