import type { QuizType, QuizQuestionResult, UserAnswer } from './quiz-types';

export interface BaseQuizPreview {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  slug: string;
}

export interface BaseQuizResultData extends BaseQuizPreview {
  quizId: string;
  questions: QuizQuestionResult[];
  type: QuizType;
  completedAt: string;
  answers: UserAnswer[];
}

export abstract class BaseQuiz {
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
}
