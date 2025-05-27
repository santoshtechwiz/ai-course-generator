import { signIn } from "next-auth/react";
import {
  generateSessionId,
  getQuizSession,
  saveQuizSession,
  getQuizResults,
  saveQuizResults,
  clearQuizSession,
  hasQuizSession,
  setupAutoSave,
  handleAuthRedirect,
  getAuthCallbackUrl,
  isReturningFromAuth,
  shouldShowResults,
  QuizType
} from '../../store/utils/authUtils';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn()
}));

// Mock timers
jest.useFakeTimers();

describe('authUtils', () => {
  // Mock sessionStorage
  const mockSessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Setup sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
  });

  describe('Session ID', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).toContain('quiz_');
      expect(id2).toContain('quiz_');
      expect(id1).not.toEqual(id2);
    });
  });

  describe('Session Storage', () => {
    it('should save quiz session with debounce', () => {
      const sessionId = 'test-session';
      const quizId = 'test-quiz';
      const answers = { q1: { answer: 'test' } };
      
      saveQuizSession(sessionId, quizId, answers);
      
      // Should not call setItem immediately due to debounce
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      
      // Advance timers to trigger debounced function
      jest.advanceTimersByTime(300);
      
      // Now it should have been called
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'quiz_session_test-session',
        expect.stringContaining('"quizId":"test-quiz"')
      );
    });

    it('should get quiz session', () => {
      const sessionId = 'test-session';
      const mockData = JSON.stringify({
        quizId: 'test-quiz',
        answers: { q1: { answer: 'test' } },
        lastSaved: Date.now()
      });
      
      mockSessionStorage.getItem.mockReturnValueOnce(mockData);
      
      const result = getQuizSession(sessionId);
      
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('quiz_session_test-session');
      expect(result).toEqual(JSON.parse(mockData));
    });

    it('should return null when session does not exist', () => {
      const sessionId = 'non-existent';
      mockSessionStorage.getItem.mockReturnValueOnce(null);
      
      const result = getQuizSession(sessionId);
      
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors in getQuizSession', () => {
      const sessionId = 'test-session';
      mockSessionStorage.getItem.mockReturnValueOnce('{invalid-json}');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = getQuizSession(sessionId);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse session:', expect.any(Error));
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should save quiz results', () => {
      const sessionId = 'test-session';
      const results = { score: 10, total: 15 };
      
      saveQuizResults(sessionId, results);
      
      // Queue should process synchronously in tests
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'quiz_results_test-session',
        JSON.stringify(results)
      );
    });

    it('should get quiz results', () => {
      const sessionId = 'test-session';
      const mockResults = { score: 10, total: 15 };
      
      mockSessionStorage.getItem.mockReturnValueOnce(JSON.stringify(mockResults));
      
      const result = getQuizResults(sessionId);
      
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('quiz_results_test-session');
      expect(result).toEqual(mockResults);
    });

    it('should handle JSON parse errors in getQuizResults', () => {
      const sessionId = 'test-session';
      mockSessionStorage.getItem.mockReturnValueOnce('{invalid-json}');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = getQuizResults(sessionId);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse results:', expect.any(Error));
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should clear quiz session', () => {
      const sessionId = 'test-session';
      
      clearQuizSession(sessionId);
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('quiz_session_test-session');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('quiz_results_test-session');
    });

    it('should check if quiz session exists', () => {
      const sessionId = 'test-session';
      
      // Case 1: Session exists
      mockSessionStorage.getItem.mockReturnValueOnce('{}');
      const exists = hasQuizSession(sessionId);
      expect(exists).toBe(true);
      
      // Case 2: Session doesn't exist
      mockSessionStorage.getItem.mockReturnValueOnce(null);
      const notExists = hasQuizSession(sessionId);
      expect(notExists).toBe(false);
    });
  });

  describe('Auto Save', () => {
    it('should setup auto save interval', () => {
      const sessionId = 'test-session';
      const quizId = 'test-quiz';
      const answers = { q1: { answer: 'test' } };
      const getAnswers = jest.fn().mockReturnValue(answers);
      
      const clearAutoSave = setupAutoSave(sessionId, quizId, getAnswers, 1000);
      
      // Auto-save hasn't run yet
      expect(getAnswers).not.toHaveBeenCalled();
      
      // Advance timer to trigger auto-save
      jest.advanceTimersByTime(1000);
      
      expect(getAnswers).toHaveBeenCalledTimes(1);
      // Check that answers were saved
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('quiz_session_'),
        expect.stringContaining('"quizId":"test-quiz"')
      );
      
      // Cleanup
      clearAutoSave();
      
      // Advance timer again - should not trigger another save
      jest.advanceTimersByTime(1000);
      expect(getAnswers).toHaveBeenCalledTimes(1); // Still just once
    });

    it('should not auto-save when no answers exist', () => {
      const sessionId = 'test-session';
      const quizId = 'test-quiz';
      const getAnswers = jest.fn().mockReturnValue({});
      
      setupAutoSave(sessionId, quizId, getAnswers, 1000);
      
      // Advance timer
      jest.advanceTimersByTime(1000);
      
      expect(getAnswers).toHaveBeenCalled();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Auth Functions', () => {
    it('should handle auth redirect', () => {
      const mockDispatch = jest.fn();
      const params = {
        slug: 'test-quiz',
        quizId: '123',
        type: 'mcq' as QuizType,
        answers: { q1: { answer: 'test' } },
        currentQuestionIndex: 2
      };
      
      handleAuthRedirect(mockDispatch, params);
      
      expect(signIn).toHaveBeenCalledWith(undefined, {
        callbackUrl: '/dashboard/mcq/test-quiz?fromAuth=true',
      });
    });

    it('should generate auth callback URL', () => {
      const url = getAuthCallbackUrl('mcq', 'test-quiz');
      expect(url).toBe('/dashboard/mcq/test-quiz?fromAuth=true');
      
      const resultsUrl = getAuthCallbackUrl('mcq', 'test-quiz', true);
      expect(resultsUrl).toBe('/dashboard/mcq/test-quiz?fromAuth=true&showResults=true');
    });

    it('should detect returning from auth', () => {
      const params1 = new URLSearchParams('fromAuth=true');
      expect(isReturningFromAuth(params1)).toBe(true);
      
      const params2 = new URLSearchParams('fromAuth=false');
      expect(isReturningFromAuth(params2)).toBe(false);
      
      const params3 = new URLSearchParams();
      expect(isReturningFromAuth(params3)).toBe(false);
    });

    it('should detect if should show results', () => {
      const params1 = new URLSearchParams('showResults=true');
      expect(shouldShowResults(params1)).toBe(true);
      
      const params2 = new URLSearchParams('showResults=false');
      expect(shouldShowResults(params2)).toBe(false);
      
      const params3 = new URLSearchParams();
      expect(shouldShowResults(params3)).toBe(false);
    });
  });
  
  describe('Queue Management', () => {
    it('should batch multiple storage operations', () => {
      // Multiple save operations in quick succession
      for (let i = 0; i < 10; i++) {
        saveQuizResults(`session-${i}`, { score: i });
      }
      
      // Expect operations to be batched (maximum 5 per batch as per MAX_QUEUE_BATCH)
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(5);
      
      // Reset mock
      mockSessionStorage.setItem.mockReset();
      
      // Process remaining queue
      jest.runAllTicks();
      
      // Expect remaining operations to be processed
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(5);
    });
  });
});
