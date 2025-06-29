// Authentication types for consistent auth handling across quiz types

import { QuizType } from "./quiz-types";

export type AuthStatus = 'idle' | 'loading' | 'error';

export interface UserSubscription {
  id: string;
  status: string;
  planId: string;
  currentPeriodEnd: Date | string;
  cancelAtPeriodEnd?: boolean;
}

export interface TokenUsage {
  tokensUsed: number;
  total: number;
  percentage: number;
}

export interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  credits: number;
  userType?: string;
  isAdmin?: boolean;
  subscription?: UserSubscription | null;
  lastActiveAt?: Date | string | null;
  creditsUsed?: number;
  engagementScore?: number;
  streakDays?: number;
  tokenUsage?: TokenUsage;
  emailVerified?: Date | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  status: AuthStatus;
  error: string | null;
  redirectPath: string | null;
  user?: UserData | null;
}

export interface AuthRedirectState {
  slug: string;
  quizId: string;
  type: QuizType;
  answers: any;
  currentQuestionIndex: number;
  tempResults?: any;
}

export interface AuthPromptProps {
  onSignIn: () => void;
  title?: string;
  message?: string;
  quizType: QuizType;
  showSaveMessage?: boolean;
  previewData?: any;
}
