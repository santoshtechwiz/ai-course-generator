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
    hints?: string;
    difficulty?: string;
    tags?: string;
    [key: string]: any;
  };
}

export interface OpenEndedQuestion extends BaseQuestion {
  answer?: string;
  keywords?: string[];
  explanation?: string;
  sampleAnswer?: string;
  hints?: string;
  difficulty?: string;
  tags?: string[];
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
  type: "mcq" | "blank" | "openended" | "code";
  [key: string]: any;
}

export interface McqAnswer extends QuizAnswer {
  selectedOptionId: string;
  isCorrect?: boolean;
}

export interface BlankAnswer extends QuizAnswer {
  textAnswer: string;
  similarity?: number;
  similarityLabel?: string;
  completedAt?: string;
  isCorrect?: boolean;
}

export interface OpenEndedAnswer extends QuizAnswer {
  textAnswer: string;
  similarity?: number;
  isCorrect?: boolean;
  hintsUsed?: boolean;
  timeSpent?: number;
  completedAt?: string;
}

export interface CodeAnswer extends QuizAnswer {
  selectedOptionId: string;
  isCorrect?: boolean;
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
  duration?: number;
  questionResults?: Array<{
    questionId: string | number;
    isCorrect?: boolean;
    userAnswer?: string;
    correctAnswer?: string;
    similarity?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}
