import { prepareSubmissionPayload, validateQuizSubmission } from "@/lib/utils/quiz-submission-utils";


describe('Quiz Submission Utilities', () => {
  describe('prepareSubmissionPayload', () => {
    it('should prepare a valid MCQ payload with all required fields', () => {
      // Arrange
      const quiz = {
        id: 'quiz-123',
        slug: 'test-mcq-quiz',
        type: 'mcq'
      };
      
      const userAnswers = [
        { questionId: 'q1', answer: 'Option A', isCorrect: true, timeSpent: 30 },
        { questionId: 'q2', answer: 'Option B', isCorrect: false, timeSpent: 45 },
        { questionId: 'q3', answer: 'Option C', isCorrect: true, timeSpent: 25 }
      ];
      
      const totalTime = 100;
      
      // Act
      const result = prepareSubmissionPayload(quiz, userAnswers, totalTime);
      
      // Assert
      expect(result).toEqual({
        quizId: 'quiz-123',
        slug: 'test-mcq-quiz',
        type: 'mcq',
        answers: userAnswers,
        score: 2, // Count of correct answers
        totalTime: 100,
        totalQuestions: 3,
        correctAnswers: 2
      });
    });
    
    it('should prepare a valid CODE payload with all required fields', () => {
      // Arrange
      const quiz = {
        id: 'quiz-456',
        slug: 'test-code-quiz',
        type: 'code'
      };
      
      const userAnswers = [
        { questionId: 'q1', answer: 'console.log("test");', isCorrect: true, timeSpent: 60 },
        { questionId: 'q2', answer: 'const x = 10;', isCorrect: true, timeSpent: 90 }
      ];
      
      const totalTime = 150;
      
      // Act
      const result = prepareSubmissionPayload(quiz, userAnswers, totalTime);
      
      // Assert
      expect(result).toEqual({
        quizId: 'quiz-456',
        slug: 'test-code-quiz',
        type: 'code',
        answers: userAnswers,
        score: 2,
        totalTime: 150,
        totalQuestions: 2,
        correctAnswers: 2
      });
    });
    
    it('should handle missing isCorrect property gracefully', () => {
      // Arrange
      const quiz = {
        id: 'quiz-789',
        slug: 'test-mixed-quiz',
        type: 'mcq'
      };
      
      const userAnswers = [
        { questionId: 'q1', answer: 'Option A', timeSpent: 30 }, // Missing isCorrect
        { questionId: 'q2', answer: 'Option B', isCorrect: false, timeSpent: 45 },
        { questionId: 'q3', answer: 'Option C', isCorrect: true, timeSpent: 25 }
      ];
      
      const totalTime = 100;
      
      // Act
      const result = prepareSubmissionPayload(quiz, userAnswers, totalTime);
      
      // Assert
      expect(result).toEqual({
        quizId: 'quiz-789',
        slug: 'test-mixed-quiz',
        type: 'mcq',
        answers: expect.arrayContaining([
          expect.objectContaining({ questionId: 'q1', answer: 'Option A' }),
          expect.objectContaining({ questionId: 'q2', answer: 'Option B', isCorrect: false }),
          expect.objectContaining({ questionId: 'q3', answer: 'Option C', isCorrect: true })
        ]),
        score: 1, // Only count answers with isCorrect: true
        totalTime: 100,
        totalQuestions: 3,
        correctAnswers: 1
      });
    });
    
    it('should calculate score based on correct answers', () => {
      // Arrange
      const quiz = {
        id: 'quiz-123',
        slug: 'test-scoring-quiz',
        type: 'mcq'
      };
      
      const userAnswers = [
        { questionId: 'q1', answer: 'Option A', isCorrect: true, timeSpent: 30 },
        { questionId: 'q2', answer: 'Option B', isCorrect: false, timeSpent: 20 },
        { questionId: 'q3', answer: 'Option C', isCorrect: true, timeSpent: 40 },
        { questionId: 'q4', answer: 'Option D', isCorrect: false, timeSpent: 15 },
        { questionId: 'q5', answer: 'Option E', isCorrect: true, timeSpent: 25 }
      ];
      
      const totalTime = 130;
      
      // Act
      const result = prepareSubmissionPayload(quiz, userAnswers, totalTime);
      
      // Assert
      expect(result.score).toBe(3); // Three answers with isCorrect: true
      expect(result.correctAnswers).toBe(3);
      expect(result.totalQuestions).toBe(5);
    });
  });
  
  describe('validateQuizSubmission', () => {
    it('should validate a proper submission payload', () => {
      // Arrange
      const validPayload = {
        quizId: 'quiz-123',
        slug: 'test-quiz',
        type: 'mcq',
        answers: [
          { questionId: 'q1', answer: 'Option A', isCorrect: true, timeSpent: 30 }
        ],
        score: 1,
        totalTime: 30,
        totalQuestions: 1,
        correctAnswers: 1
      };
      
      // Act
      const result = validateQuizSubmission(validPayload);
      
      // Assert
      expect(result).toEqual({
        isValid: true
      });
    });
    
    it('should reject invalid submission payloads', () => {
      // Missing required fields
      const missingFields = {
        quizId: 'quiz-123',
        // Missing type
        answers: [
          { questionId: 'q1', answer: 'Option A', timeSpent: 30 }
        ]
        // Missing score and totalTime
      };
      
      // Empty answers array
      const emptyAnswers = {
        quizId: 'quiz-123',
        slug: 'test-quiz',
        type: 'mcq',
        answers: [], // Empty answers
        score: 0,
        totalTime: 0,
        totalQuestions: 0,
        correctAnswers: 0
      };
      
      // Invalid answer format (missing properties)
      const invalidAnswerFormat = {
        quizId: 'quiz-123',
        slug: 'test-quiz',
        type: 'mcq',
        answers: [
          { questionId: 'q1' } // Missing answer and timeSpent
        ],
        score: 0,
        totalTime: 30,
        totalQuestions: 1,
        correctAnswers: 0
      };
      
      // Act & Assert
      expect(validateQuizSubmission(missingFields)).toEqual({
        isValid: false,
        errors: expect.arrayContaining(['Missing required fields'])
      });
      
      expect(validateQuizSubmission(emptyAnswers)).toEqual({
        isValid: false,
        errors: expect.arrayContaining(['No answers provided'])
      });
      
      expect(validateQuizSubmission(invalidAnswerFormat)).toEqual({
        isValid: false,
        errors: expect.arrayContaining(['Invalid answer format'])
      });
    });
  });
});
