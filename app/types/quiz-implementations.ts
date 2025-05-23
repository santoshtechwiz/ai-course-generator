import { BaseQuiz, BaseQuizResultData } from './quiz-base';
import type { UserAnswer, QuizQuestion, MCQQuestion, BlankQuestion, CodeQuizQuestion } from './quiz-types';

export class CodeQuiz extends BaseQuiz {
  constructor(data: Omit<BaseQuizResultData, 'type'>) {
    super('code', { ...data, type: 'code' });
  }

  validateAnswer(answer: string, questionId: string): boolean {
    const question = this.getQuestion(questionId);
    if (!question) return false;
    return answer.trim().toLowerCase() === (question.correctAnswer || question.answer).toLowerCase();
  }

  formatQuestion(question: any): string {
    return question.question;
  }

  evaluateAnswer(answer: string, timeSpent: number): UserAnswer {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) throw new Error('No current question');

    const isCorrect = this.validateAnswer(answer, currentQ.id);
    return {
      questionId: currentQ.id,
      answer,
      timeSpent,
      isCorrect
    };
  }
}

export class MCQQuiz extends BaseQuiz<MCQQuestion> {
  constructor() {
    super('mcq');
  }

  validateAnswer(answer: string, questionId: string): boolean {
    const question = this.getQuestion(questionId);
    if (!question) return false;
    return answer === question.correctAnswer;
  }

  formatQuestion(question: any): string {
    return question.question;
  }
}

export class BlanksQuiz extends BaseQuiz<BlankQuestion> {
  constructor() {
    super('blanks');
  }

  validateAnswer(answer: string, questionId: string): boolean {
    const question = this.getQuestion(questionId);
    if (!question) return false;
    return answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
  }

  formatQuestion(question: any): string {
    return question.question.replace(/\[\[(.*?)\]\]/g, '_____');
  }
}
