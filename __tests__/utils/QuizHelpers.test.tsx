import { createResultsPreview, prepareSubmissionPayload } from "@/app/dashboard/(quiz)/code/components/QuizHelpers";
import { CodeQuizQuestion } from "@/app/types/code-quiz-types";
import { UserAnswer } from "@/app/types/quiz-types";

describe('QuizHelpers', () => {
  describe('createResultsPreview', () => {
    it('calculates scores correctly', () => {
      const questions = [
        {
          id: '1',
          question: 'Test question 1',
          answer: 'answer1',
          type: 'code' as const
        },
        {
          id: '2',
          question: 'Test question 2',
          answer: 'answer2',
          type: 'code' as const
        }
      ] as CodeQuizQuestion[];

      const answers = [
        {
          questionId: '1',
          answer: 'answer1',
          isCorrect: true,
        },
        {
          questionId: '2',
          answer: 'wrong',
          isCorrect: false,
        }
      ] as UserAnswer[];

      const results = createResultsPreview({
        questions,
        answers,
        quizTitle: 'Test Quiz',
        slug: 'test-quiz'
      });

      expect(results.score).toBe(1);
      expect(results.maxScore).toBe(2);
      expect(results.percentage).toBe(50);
      expect(results.questions).toHaveLength(2);
      expect(results.questions[0].isCorrect).toBe(true);
      expect(results.questions[1].isCorrect).toBe(false);
    });
  });

  describe('prepareSubmissionPayload', () => {
    it('formats answers correctly', () => {
      const answers = [
        {
          questionId: '1',
          answer: 'test answer',
          timeSpent: 30
        },
        {
          questionId: '2',
          answer: { complex: 'object' },
          timeSpent: 45
        }
      ] as UserAnswer[];

      const payload = prepareSubmissionPayload({
        answers,
        quizId: '123',
        slug: 'test-slug'
      });

      expect(payload.quizId).toBe('123');
      expect(payload.slug).toBe('test-slug');
      expect(payload.type).toBe('code');
      expect(payload.answers).toHaveLength(2);
      expect(payload.answers[0].answer).toBe('test answer');
      expect(payload.answers[1].answer).toBe('{"complex":"object"}');
    });
  });
});
