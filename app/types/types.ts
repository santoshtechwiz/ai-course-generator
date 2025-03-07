import { Prisma, User } from "@prisma/client"


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
export interface CourseMetadata {
  rating?: number
  difficulty?: string | null
  estimatedHours?: number
}
export interface CourseCardProps {
  id: string
  name: string
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
export interface Course extends CourseMetadata {
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



export interface UserQuiz {
  id: number
  title: string
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
    title: string
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
  topPerformingtitles: titlePerformance[]
  recentImprovement: number
  quizzesPerMonth: number
  courseCompletionRate: number
  consistencyScore: number
  learningEfficiency: number
  difficultyProgression: number
}

export interface titlePerformance {
  title: string
  averageScore: number
  attempts: number
  averageTimeSpent: number
}

export interface CourseQuiz {
  id: number
  question: string
  answer: string
}
export interface RandomQuizProps {


}
export interface CourseDetails {

  id: number,
  courseName: string,
  category: string,
  totalChapters: number,
  totalUnits: number,
  slug: string
}
export class CourseAIErrors {
  constructor(public message: string) { }
}
export interface FullChapterType {
  id: number,
  videoId: string,
  chapterId: number;
  description: string;

  name: string;
  order: number;
  courseId: number;
  isCompleted: boolean;
  questions: CourseQuestion[]
  summary: string
  chapter: FullChapterType


}

export type CourseQuestion = {
  id: number
  question: string
  options: string[]
  answer: string
}


export type UserQuizQuestion = {
  id: number
  question: string
  options: string[]
  answer: string
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
  title: string
  slug: string
  questionCount: number
  questions: UserQuizQuestion[]
  isPublic: boolean
  quizType: string
  tags: string[]
  difficulty?: string,
  bestScore?: number | null,
  lastAttempted?: Date | null
}
export interface CreateQuizCardConfig {
  title?: string
  description?: string
  createUrl?: string
  animationDuration?: number
  className?: string
}

export interface MultipleChoiceQuestion {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;

}
export interface OpenEndedQuestion {

  question: string;
  answer: string;

}
export type QuizType = "mcq" | "openended" | "fill-blanks" | "code"|"undefined"

export interface CodeChallenge {
  question: string
  codeSnippet?: string
  language?: string
  options: string | string[]
  correctAnswer: string
}


export interface QuizQuestion {
  question: string
  options: string[]
  codeSnippet: string | null
  language?: string,
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

/* CHAT GPT */


export interface QuizQuestion {
  question: string
  correct_answer: string
  hints: string[]
  difficulty: string
  tags: string[]
}

export interface Quiz {
  quiz_title: string
  questions: QuizQuestion[]
}

export interface OpenAIFunction {
  name: string
  description: string
  parameters: {
    type: string
    properties: {
      [key: string]: any
    }
    required: string[]
  }
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface QuizGenerationParams {
  model: string
  messages: OpenAIMessage[]
  functions: OpenAIFunction[]
  functionCall: { name: string }
}

export interface FullCourseType {
  id: number;
  name: string;
  description: string | null;
  image: string;
  viewCount: number;
  userId: string;
  categoryId: number | null;
  isCompleted: boolean | null;
  isPublic: boolean;
  slug: string | null;
  difficulty: string | null;
  estimatedHours: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  ratings: CourseRating[];
  courseUnits: FullCourseUnit[];
  courseProgress: CourseProgress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseRating {
  id: number;
  courseId: number;
  userId: string;
  rating: number;
  reviewText: string | null;
  createdAt: Date;
}

export interface FullCourseUnit {
  id: number;
  courseId: number;
  name: string;
  isCompleted: boolean | null;

  chapters: FullChapter[];
}

export interface FullChapter {
  id: number;
  name: string;
  videoId: string | null;
  order: number | null;
  isCompleted: boolean | null;
  summary: string | null;
  description: string | null;
  questions:  CourseQuestion[];

}

export interface FullCourseQuiz {
  id: number;
  question: string;
  answer: string;
  attempts: CourseQuizAttempt[];
}

export interface CourseProgress {
  id: number;
  userId: string;
  courseId: number;
  currentChapterId: number;
  currentUnitId: number | null;
  completedChapters: string;
  progress: number;
  lastAccessedAt: Date;
  timeSpent: number;
  isCompleted: boolean;
  completionDate: Date | null;
  quizProgress: string | null;
  notes: string | null;
  bookmarks: string | null;
  lastInteractionType: string | null;
  interactionCount: number;
  engagementScore: number;

}

export interface CourseQuizAttempt {
  id: number;
  userId: string;
  courseQuizId: number;
  score: number | null;
  timeSpent: number | null;
  createdAt: Date;
  updatedAt: Date;
  improvement: number | null;
  accuracy: number | null;

}
export interface QuestionOpenEnded {
  id: number;
  question: string;
  answer: string;
  openEndedQuestion: {
    hints: string;
    difficulty: string;
    tags: string;
    inputType: string;
  };
}


export interface YoutubeSearchResponse {

  items: Array<{
    id: {

      videoId: string;

    };

  }>;

}

export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}
export interface TranscriptResponse{
  
  status: number;
  message: string;
  
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
  id?: string
  question: string
  answer: string
  userId?: string
  quizId?: string
  createdAt?: Date
  isSaved?: boolean
}

