// Authentication types for consistent auth handling across quiz types

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  redirectPath: string | null;
}

export interface AuthRedirectState {
  slug: string;
  quizId: string;
  type: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';
  answers: any;
  currentQuestionIndex: number;
  tempResults?: any;
}

export interface AuthPromptProps {
  onSignIn: () => void;
  title?: string;
  message?: string;
  quizType: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';
  showSaveMessage?: boolean;
  previewData?: any;
}
