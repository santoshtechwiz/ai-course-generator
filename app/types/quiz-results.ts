import type { QuizType, QuizQuestionResult, UserAnswer } from './quiz-types'

export interface QuizResultPreview {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  slug: string;
}

export interface QuizResult extends QuizResultPreview {
  quizId: string;
  questions: QuizQuestionResult[];
  type: QuizType;
  completedAt: string;
  answers: UserAnswer[];
}

export abstract class BaseQuizResult {
  constructor(
    public readonly quizId: string,
    public readonly slug: string,
    public readonly title: string,
    public readonly score: number,
    public readonly maxScore: number,
    public readonly questions: QuizQuestionResult[],
    public readonly type: QuizType,
    public readonly answers: UserAnswer[],
    public readonly completedAt: string = new Date().toISOString()
  ) {}

  get percentage(): number {
    return this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 0
  }

  toPreview(): QuizResultPreview {
    return {
      title: this.title,
      score: this.score,
      maxScore: this.maxScore,
      percentage: this.percentage,
      slug: this.slug,
    }
  }

  toFullResult(): QuizResult {
    return {
      ...this.toPreview(),
      quizId: this.quizId,
      questions: this.questions,
      type: this.type,
      completedAt: this.completedAt,
      answers: this.answers,
    }
  }
}

export class CodeQuizResult extends BaseQuizResult {
  constructor(data: Partial<QuizResult> & Pick<QuizResult, 'quizId' | 'slug'>) {
    super(
      data.quizId,
      data.slug,
      data.title || 'Untitled Quiz',
      data.score || 0,
      data.maxScore || data.questions?.length || 0,
      data.questions || [],
      'code',
      data.answers || [],
      data.completedAt
    );
  }
}

export class QuizResultFactory {
  static createResult(type: QuizType, data: Partial<QuizResult> & Pick<QuizResult, 'quizId' | 'slug'>): BaseQuizResult {
    switch (type) {
      case 'code':
        return new CodeQuizResult(data);
      // Add other quiz types here
      default:
        throw new Error(`Unsupported quiz type: ${type}`);
    }
  }
}
