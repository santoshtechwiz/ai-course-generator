// src/types.ts
export interface QuizResults {
  score: number;
  maxScore: number;
  percentage: number;
  questionResults: Array<{
    questionId: string;
    correct: boolean;
    feedback?: string;
    score?: number;
  }>;
  submittedAt: number;
}

export interface BaseQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'code' | 'blanks' | 'openended';
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code';
  initialCode: string;
  language: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface BlanksQuestion extends BaseQuestion {
  type: 'blanks';
  textWithBlanks: string;
  blanks: Array<{
    id: string;
    correctAnswer: string;
  }>;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended';
  modelAnswer?: string;
  keywords?: string[];
}

export type Question = MCQQuestion | CodeQuestion | BlanksQuestion | OpenEndedQuestion;

export interface BaseAnswer {
  questionId: string;
  timestamp: number;
}

export interface MCQAnswer extends BaseAnswer {
  selectedOptionId: string;
}

export interface CodeAnswer extends BaseAnswer {
  code: string;
}

export interface BlanksAnswer extends BaseAnswer {
  filledBlanks: Record<string, string>;
}

export interface OpenEndedAnswer extends BaseAnswer {
  text: string;
}

export type Answer = MCQAnswer | CodeAnswer | BlanksAnswer | OpenEndedAnswer;
