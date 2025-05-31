export interface BaseQuestion {
  id: string | number;
  type?: string;
  text?: string;
  question?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface McqQuestion extends BaseQuestion {
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
}

export interface BlankQuestion extends BaseQuestion {
  answer: string;
  openEndedQuestion?: {
    id: string | number;
    text: string;
    correctAnswer?: string;
    [key: string]: any;
  };
}

export interface OpenEndedQuestion extends BaseQuestion {
  answer?: string;
  keywords?: string[];
  explanation?: string;
  sampleAnswer?: string;
}

export interface CodeQuestion extends BaseQuestion {
  codeSnippet?: string;
  language?: string;
  options: string[];
  correctAnswer?: string;
}

export interface QuizAnswer {
  questionId: string | number;
  timestamp: number;
  type: "mcq" | "blanks" | "openended" | "code";
  [key: string]: any;
}

export interface McqAnswer extends QuizAnswer {
  selectedOptionId: string;
}

export interface BlankAnswer extends QuizAnswer {
  userAnswer: string;
}

export interface OpenEndedAnswer extends QuizAnswer {
  text: string;
  similarity?: number;
  isCorrect?: boolean;
  hintsUsed?: boolean;
  timeSpent?: number;
}

export interface CodeAnswer extends QuizAnswer {
  selectedOptionId: string;
}

export interface QuizResult {
  slug: string;
  quizId?: string;
  title?: string;
  completedAt?: string | Date;
  score?: number;
  maxScore?: number;
  percentage?: number;
  questions?: BaseQuestion[];
  questionResults?: Array<{
    questionId: string | number;
    isCorrect?: boolean;
    [key: string]: any;
  }>;
  [key: string]: any;
}
