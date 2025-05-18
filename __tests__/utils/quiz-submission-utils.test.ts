import { prepareSubmissionPayload, validateQuizSubmission } from "@/lib/utils/quiz-submission-utils";
import { UserAnswer, QuizType } from "@/app/types/quiz-types";

describe('Quiz Submission Utilities', () => {
  describe('prepareSubmissionPayload', () => {
    it('should prepare a valid MCQ payload with all required fields', () => {
      // Arrange
      const answers: UserAnswer[] = [
        { questionId: "1", answer: "Option A", isCorrect: true },
        { questionId: "2", answer: "Option B", isCorrect: false }
      ];
      
      // Act
      const payload = prepareSubmissionPayload({
        slug: "test-quiz",
        quizId: "123",
        type: "mcq",
        answers
      });
      
      // Assert
      expect(payload).toHaveProperty('quizId', "123");
      expect(payload).toHaveProperty('totalTime');
      expect(payload).toHaveProperty('score');
      expect(payload).toHaveProperty('answers');
      expect(payload.answers).toHaveLength(2);
      expect(payload.answers[0]).toHaveProperty('isCorrect', true);
      expect(payload.answers[0]).toHaveProperty('answer', 'Option A');
    });

    it('should prepare a valid CODE payload with all required fields', () => {
      // Arrange
      const answers: UserAnswer[] = [
        { questionId: "1", answer: "console.log('test');", isCorrect: true },
        { questionId: "2", answer: "return true;", isCorrect: false }
      ];
      
      // Act
      const payload = prepareSubmissionPayload({
        slug: "test-quiz",
        quizId: "123",
        type: "code",
        answers,
        timeTaken: 300
      });
      
      // Assert
      expect(payload).toHaveProperty('quizId', "123");
      expect(payload).toHaveProperty('totalTime', 300);
      expect(payload).toHaveProperty('score', 1);
      expect(payload).toHaveProperty('answers');
      expect(payload.answers).toHaveLength(2);
      expect(payload.answers[0]).toHaveProperty('isCorrect', true);
      expect(payload.answers[0]).toHaveProperty('answer', "console.log('test');");
    });

    it('should handle missing isCorrect property gracefully', () => {
      // Arrange
      const answers: UserAnswer[] = [
        { questionId: "1", answer: "Option A" },
        { questionId: "2", answer: "Option B" }
      ];
      
      // Act
      const payload = prepareSubmissionPayload({
        slug: "test-quiz",
        type: "mcq",
        answers
      });
      
      // Assert
      expect(payload.answers[0]).toHaveProperty('isCorrect', false);
      expect(payload.score).toBe(0);
    });

    it('should calculate score based on correct answers', () => {
      // Arrange
      const answers: UserAnswer[] = [
        { questionId: "1", answer: "Option A", isCorrect: true },
        { questionId: "2", answer: "Option B", isCorrect: true },
        { questionId: "3", answer: "Option C", isCorrect: false }
      ];
      
      // Act
      const payload = prepareSubmissionPayload({
        slug: "test-quiz",
        type: "mcq",
        answers
      });
      
      // Assert
      expect(payload.score).toBe(2);
      expect(payload.correctAnswers).toBe(2);
    });
  });

  describe('validateQuizSubmission', () => {
    it('should validate a proper submission payload', () => {
      // Arrange
      const payload = {
        quizId: "123",
        type: "mcq",
        answers: [{ questionId: "1", answer: "test" }],
        totalTime: 300,
        score: 1
      };
      
      // Act
      const isValid = validateQuizSubmission(payload);
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid submission payloads', () => {
      // Missing fields
      expect(validateQuizSubmission(null)).toBe(false);
      expect(validateQuizSubmission({})).toBe(false);
      expect(validateQuizSubmission({ quizId: "123" })).toBe(false);
      
      // Missing required properties
      expect(validateQuizSubmission({ 
        quizId: "123", 
        type: "mcq", 
        answers: [] 
      })).toBe(false);
      
      // Invalid score/time types
      expect(validateQuizSubmission({ 
        quizId: "123", 
        type: "mcq", 
        answers: [{ questionId: "1", answer: "test" }], 
        totalTime: "300",  // string instead of number
        score: 1
      })).toBe(false);
    });
  });
});
