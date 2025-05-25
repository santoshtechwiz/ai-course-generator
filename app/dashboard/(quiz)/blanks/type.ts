// Updated types for blanks quiz to match API response
export interface BlankQuizQuestion {
  id: number;
  question: string;
  answer: string;
  openEndedQuestion?: {
    id: number;
    question: string;
    answer: string;
  };
}

export interface BlankQuizData {
  id: number;
  slug: string;
  type: 'blanks';
  title: string;
  questions: BlankQuizQuestion[];
  userId: string;
}

export interface BlankQuizAnswer {
  questionId: number;
  filledBlanks: Record<string, string>;
  timestamp: number;
}

export interface BlankQuizState {
  quizId: string | number | null;
  quizType: string | null;
  title: string | null;
  questions: BlankQuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string | number, BlankQuizAnswer>;
  status: 'idle' | 'loading' | 'submitting' | 'error';
  error: string | null;
  isQuizComplete: boolean;
  results: any | null;
}
