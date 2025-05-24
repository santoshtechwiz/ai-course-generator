import type { QuizType, QuizQuestionResult, UserAnswer, QuizQuestion } from './quiz-types';

export interface BaseQuizPreview {
  type: QuizType;
  score: number;
  maxScore: number;
  percentage: number;
  title?: string;
  slug?: string;
}

export interface BaseQuizResult extends BaseQuizPreview {
  answers: UserAnswer[];
  questions: QuizQuestion[];
  completedAt: string;
}

export interface BaseQuestionType {
  id: string;
  question: string;
  type: QuizType;
  answer?: string;
}

export type ValidationResult = {
  isValid: boolean;
  message?: string;
};

export abstract class BaseQuiz<T extends QuizQuestion = QuizQuestion> {
  protected quizData: QuizData<T> | null = null;

  protected constructor(
    protected readonly type: QuizType,
    protected readonly data: BaseQuizResultData
  ) {}

  abstract validateAnswer(answer: string, questionId: string): boolean;

  getPreview(): BaseQuizPreview {
    return {
      title: this.data.title,
      score: this.data.score,
      maxScore: this.data.maxScore,
      percentage: this.data.percentage,
      slug: this.data.slug
    };
  }

  getFullResult(): BaseQuizResultData {
    return {
      ...this.data,
      type: this.type
    };
  }

  public getCurrentQuestion(): T | null {
    return this.quizData?.questions[this.currentQuestion] || null;
  }
}

export interface BaseQuiz {
  initialize(questions: any[]): void;
  validateAnswer(answer: any): boolean;
  calculateScore(): number;
  generatePreview(): QuizPreview;
  formatResult(): QuizResult;
}

export interface QuizPreview {
  type: QuizType;
  score: number;
  maxScore: number;
  percentage: number;
  slug?: string;
}

export interface QuizResult extends QuizPreview {
  answers: UserAnswer[];
  questions: QuizQuestion[];
  completedAt: string;
}
