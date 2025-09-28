// Consolidated ambient module declarations for project path aliases

declare module '@/components/*'
declare module '@/store/*'
declare module '@/app/*'
declare module '@/utils/*'
declare module '@/services/*'
declare module '@/modules/*'
declare module '@/constants/*'
declare module '@/types/*'
declare module '@/lib/*'
declare module '@/providers/*'
declare module '@/hooks/*'

// Common specific modules used across the app - helpful for isolated tsc checks
declare module '@/constants/global'
declare module '@/app/types/quiz-types'
declare module '@/utils/storage-manager'
declare module '@/components/ui/chart'

// Specific module shapes used across the app (loose any types for build-time checks)
declare module '@/store' {
  const _a: any
  export type RootState = any
  export default _a
}

declare module '@/app/types/quiz-types' {
  export type QuizType = any
  export * from '@/app/types/quiz-types'
}

declare module '@/constants/global' {
  export const STORAGE_KEYS: any
  export const API_PATHS: any
}

declare module '@/utils/storage-manager' {
  export const storageManager: any
  export type QuizProgress = any
}

declare module '@/components/ui/chart' { const _: any; export default _ }

// Auth module extensions
import { User } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    credits?: number;
    role?: string;
    permissions?: string[];
    userType?: string;
  }

  interface Session {
    user: User;
  }
}

// Define the Redux auth state type
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
  credits?: number;
  role?: string;
  permissions?: string[];
  userType?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Quiz types
export type QuizAnswerValue = string | number | boolean | string[] | Record<string, unknown>

export interface PersistableQuizState {
  currentQuestion: number
  userAnswers: Array<QuizAnswerValue>
  currentQuizId?: string | null
  quizData?: QuizData | null
  timeRemaining?: number
  timerActive?: boolean
}

export interface AuthRedirectState {
  slug?: string
  quizId?: string
  type?: string
  userAnswers?: Array<QuizAnswerValue>
  currentQuestion?: number
  fromSubmission?: boolean
  path?: string
  timestamp?: number
}

export interface BaseQuestion {
  id: string | number
  question: string
  type: string
  difficulty?: string
  tags?: string[]
}

export interface QuizData {
  id: string
  title: string
  slug: string
  questions: BaseQuestion[]
  type: string
  userId?: string
}

export interface TextQuizState {
  quizId: string | null
  title: string | null
  slug: string | null
  currentQuestionIndex: number
  questions: Array<BaseQuestion>
  answers: Array<QuizAnswerValue>
  status: "idle" | "active" | "answering" | "completed" | "error"
  error: string | null
  startTime: string | null
  completedAt: string | null
  score: number | null
  resultsSaved: boolean
  isCompleted?: boolean
}

export interface QuizAnswer {
  questionId: string | number
  question: string
  answer: string
  timeSpent?: number
  hintsUsed?: boolean
}

export interface OpenEndedQuestion {
  id: string | number
  question: string
  answer: string
  openEndedQuestion?: {
    hints?: string | string[]
    difficulty?: string
    tags?: string | string[]
    inputType?: string
  }
}

export interface OpenEndedQuizData {
  id: string
  title: string
  questions: OpenEndedQuestion[]
  slug?: string
  userId?: string
  type?: "openended"
}

export interface QuizResult {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  questions: BaseQuestion[]
  totalQuestions: number
  completedAt: string
}

// React Syntax Highlighter types
declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';

  interface SyntaxHighlighterProps {
    children?: string;
    style?: any;
    language?: string;
    showLineNumbers?: boolean;
    customStyle?: React.CSSProperties;
    codeTagProps?: React.HTMLProps<HTMLElement>;
    PreTag?: ComponentType<any>;
    CodeTag?: ComponentType<any>;
    [key: string]: any;
  }

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/styles/vs' {
  const vs: any;
  export default vs;
}

declare module 'react-syntax-highlighter/dist/styles/prism' {
  export const vs: any;
  export const vscDarkPlus: any;
}

// YouTube i.js types
declare module 'youtubei.js' {
  export interface InnertubeConfig {
    lang?: string;
    location?: string;
    cookie?: string;
    retriesOnFailure?: number;
  }

  export class Innertube {
    constructor(config?: InnertubeConfig);
    static create(config?: InnertubeConfig): Promise<Innertube>;
    getBasicInfo(videoId: string): Promise<any>;
    getTranscript(videoId: string): Promise<any>;
  }
}