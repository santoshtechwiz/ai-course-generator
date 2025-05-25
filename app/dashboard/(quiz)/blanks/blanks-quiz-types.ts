export interface BlanksQuizContentProps {
  quizData: any
  slug: string
  userId?: string
  quizId: string
}

export interface QuizData {
  id: string | number;  // Allow both string and number
  title: string;
  questions: Array<{
    id: string;
    question: string;
    answer?: string;
    hints?: string[];
  }>;
  userId?: string;
  type?: string;
  slug?: string;
}

export interface BlanksQuizWrapperProps {
  quizData: QuizData;
  slug: string;
  userId?: string | null;
  quizId?: string;
  isPublic?: boolean
  isFavorite?: boolean
}

export interface BlanksQuestion {
  id: string
  question: string
  answer?: string
  hints?: string[]
}

export interface BlanksAnswer {
  questionId: string | number
  question: string
  answer: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent: number
  similarity?: number
  hintsUsed?: boolean
  index: number
}

export interface BlanksQuizResult {
  quizId: string
  slug: string
  score: number
  totalQuestions: number
  correctAnswers: number
  totalTimeSpent: number
  formattedTimeSpent?: string
  completedAt: string
  answers: BlanksAnswer[]
}

export interface BlanksQuizProps {
  question: {
    id: string;
    question: string;
    answer?: string;
    hints?: string[];
  };
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  onQuestionComplete?: () => void;
}

// Add result types
export interface BlanksQuizResultData {
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  totalTimeSpent: number;
  score: number;
  completedAt: string;
}
