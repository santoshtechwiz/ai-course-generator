export interface CodeOption {
  id: string;
  text: string;
  code: string;
}

export interface CodeQuestion {
  id: string | number;
  title?: string;
  text?: string;
  question?: string;
  options: Array<CodeOption>;
  correctOptionId: string;
  explanation?: string;
  type?: string;
  codeSnippet?: string;
  language?: string;
}

export interface CodeAnswer {
  questionId: string | number;
  selectedOptionId: string;
  timestamp: number;
  type: string;
  isCorrect: boolean;
}

export interface CodeQuizResult {
  quizId: string | number;
  slug: string;
  title: string;
  questions?: CodeQuestion[] | null;
  questionResults?: any[];
  answers?: CodeAnswer[] | null;
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
}
