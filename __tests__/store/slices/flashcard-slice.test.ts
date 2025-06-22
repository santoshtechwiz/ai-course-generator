import { configureStore } from '@reduxjs/toolkit';
import flashcardReducer, {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  completeFlashCardQuiz,
  resetFlashCards,
  forceResetFlashCards,
  clearQuizState,
  nextFlashCard,
  setCurrentFlashCard,
  completeQuiz,
  setQuizResults,
  resetRedirectFlag,
  savePendingResults,
  restoreResultsAfterAuth,
  setRequiresFlashCardAuth,
  setPendingFlashCardAuth,
  // Selectors
  selectQuizQuestions,
  selectIsQuizComplete,
  selectQuizTitle,
  selectCurrentQuestionIndex,
  selectAnswers,
  selectShouldRedirectToResults,
  selectCompleteResults,
  selectQuizStatus,
  selectQuizError,
  selectQuizId,
  selectQuizSlug,
  selectQuizResults,
  selectRequiresAuth,
  selectPendingAuthRequired,
  selectFlashcardState,
  selectFlashcardScore,
  selectFlashcardTotalQuestions,
  selectFlashcardCorrectAnswers,
  selectFlashcardTotalTime,
  selectFlashcardStillLearningCount,
  selectFlashcardIncorrectCount,
  selectFlashcardAnswerBreakdown,
  selectProcessedResults,
} from '@/store/slices/flashcard-slice';
import { fetchFlashCardQuiz, saveFlashCardResults, saveFlashCardResultsLocally } from '@/store/slices/flashcard-slice';
import { ANSWER_TYPES, STORAGE_KEYS } from '@/constants/global';

// Setup mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Setup mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock the fetch function for API calls
global.fetch = jest.fn();

// Create a mock RootState type for testing
type MockRootState = {
  flashcard: ReturnType<typeof flashcardReducer>;
};

// Helper to setup a test store with initial state
const setupStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      flashcard: flashcardReducer
    },
    preloadedState: {
      flashcard: {
        quizId: null,
        slug: null,
        title: '',
        questions: [],
        currentQuestion: 0,
        answers: [],
        status: 'idle' as "idle" | "loading" | "succeeded" | "failed" | "submitting" | "completed" | "completed_with_errors",
        error: null,
        isCompleted: false,
        results: null,
        shouldRedirectToResults: false,
        requiresAuth: false,
        pendingAuthRequired: false,
        ...preloadedState
      }
    }
  });
};

// Sample quiz data for tests
const sampleQuiz = {
  id: 'quiz-123',
  slug: 'test-flashcards',
  title: 'Test Flashcard Quiz',
  questions: [
    { 
      id: '1',
      question: 'What is React?',
      answer: 'A JavaScript library for building user interfaces',
      options: ['A JavaScript library for building user interfaces', 'A server-side framework', 'A database technology', 'A styling library']
    },
    { 
      id: '2',
      question: 'What is Redux?',
      answer: 'A state management library for JavaScript applications',
      options: ['A state management library for JavaScript applications', 'A UI component library', 'A testing framework', 'A build tool']
    },
    { 
      id: '3',
      question: 'What is TypeScript?',
      answer: 'A statically typed superset of JavaScript',
      options: ['A statically typed superset of JavaScript', 'A JavaScript runtime', 'A JavaScript compiler', 'A JavaScript testing library']
    }
  ]
};

describe('Flashcard Redux Slice', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.resetAllMocks();
    
    // Reset localStorage and sessionStorage mocks
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  describe('Reducers', () => {
    test('should return the initial state', () => {
      const store = setupStore();
      const state = store.getState().flashcard;
      
      expect(state).toEqual({
        quizId: null,
        slug: null,
        title: '',
        questions: [],
        currentQuestion: 0,
        answers: [],
        status: 'idle',
        error: null,
        isCompleted: false,
        results: null,
        shouldRedirectToResults: false,
        requiresAuth: false,
        pendingAuthRequired: false,
      });
    });

    test('should initialize quiz with initFlashCardQuiz', () => {
      const store = setupStore();
      
      store.dispatch(initFlashCardQuiz({
        id: sampleQuiz.id,
        slug: sampleQuiz.slug,
        title: sampleQuiz.title,
        questions: sampleQuiz.questions
      }));
      
      const state = store.getState().flashcard;
      
      expect(state.quizId).toBe(sampleQuiz.id);
      expect(state.slug).toBe(sampleQuiz.slug);
      expect(state.title).toBe(sampleQuiz.title);
      expect(state.questions).toEqual(sampleQuiz.questions);
      expect(state.status).toBe('succeeded');
      expect(state.isCompleted).toBe(false);
      expect(state.currentQuestion).toBe(0);
    });    test('should handle submitFlashCardAnswer action', () => {
      const store = setupStore({
        quizId: sampleQuiz.id,
        slug: sampleQuiz.slug,
        questions: sampleQuiz.questions
      });
      
      const answer = {
        questionId: '1',
        answer: "correct" as "correct" | "incorrect" | "still_learning",
        timeSpent: 10
      };
      
      store.dispatch(submitFlashCardAnswer(answer));
      
      const state = store.getState().flashcard;
      expect(state.answers).toHaveLength(1);
      expect(state.answers[0].questionId).toBe('1');
      // Use type assertions to access union types safely
      expect((state.answers[0] as any).answer).toBe('correct');
      expect((state.answers[0] as any).timeSpent).toBe(10);
      expect((state.answers[0] as any).isCorrect).toBe(true);
      
      // Submit another answer
      const answer2 = {
        questionId: '2',
        answer: "incorrect" as "correct" | "incorrect" | "still_learning",
        timeSpent: 15
      };
      
      store.dispatch(submitFlashCardAnswer(answer2));
      
      const updatedState = store.getState().flashcard;
      expect(updatedState.answers).toHaveLength(2);
      
      // Update the first answer
      const updatedAnswer = {
        questionId: '1',
        answer: "still_learning" as "correct" | "incorrect" | "still_learning",
        timeSpent: 20
      };
      
      store.dispatch(submitFlashCardAnswer(updatedAnswer));
      
      const finalState = store.getState().flashcard;
      expect(finalState.answers).toHaveLength(2);
      // Use type assertions to access union types safely
      expect((finalState.answers[0] as any).answer).toBe('still_learning');
      expect((finalState.answers[0] as any).timeSpent).toBe(20);
      expect((finalState.answers[0] as any).isCorrect).toBe(false);
    });

    test('should handle navigation actions', () => {
      const store = setupStore({
        quizId: sampleQuiz.id,
        questions: sampleQuiz.questions,
        currentQuestion: 0
      });
      
      // Move to next card
      store.dispatch(nextFlashCard());
      expect(store.getState().flashcard.currentQuestion).toBe(1);
      
      // Move again
      store.dispatch(nextFlashCard());
      expect(store.getState().flashcard.currentQuestion).toBe(2);
      
      // Shouldn't move beyond the end
      store.dispatch(nextFlashCard());
      expect(store.getState().flashcard.currentQuestion).toBe(2);
      
      // Set specific card
      store.dispatch(setCurrentFlashCard(0));
      expect(store.getState().flashcard.currentQuestion).toBe(0);
    });    test('should handle completeFlashCardQuiz action', () => {
      const store = setupStore({
        quizId: sampleQuiz.id,
        slug: sampleQuiz.slug,
        title: sampleQuiz.title,
        questions: sampleQuiz.questions,
        answers: [
          { questionId: '1', answer: 'correct' as "correct", isCorrect: true, timeSpent: 10 },
          { questionId: '2', answer: 'incorrect' as "incorrect", isCorrect: false, timeSpent: 15 },
          { questionId: '3', answer: 'still_learning' as "still_learning", isCorrect: false, timeSpent: 12 }
        ]
      });
      
      // Use as any to bypass strict typing for test purposes
      const quizResults = {
        quizId: sampleQuiz.id,
        slug: sampleQuiz.slug,
        title: sampleQuiz.title,
        score: 33.33,
        percentage: 33.33,
        correctCount: 1,
        incorrectCount: 1,
        stillLearningCount: 1,
        correctAnswers: 1,
        stillLearningAnswers: 1,
        incorrectAnswers: 1,
        totalQuestions: 3,
        totalTime: 37,
        completedAt: '2025-06-21T12:00:00Z',
        reviewCards: [2],
        stillLearningCards: [3],
        questions: sampleQuiz.questions
      } as any;
      
      store.dispatch(completeFlashCardQuiz(quizResults));
      
      const state = store.getState().flashcard;
      
      expect(state.isCompleted).toBe(true);
      expect(state.status).toBe('completed');
      expect(state.shouldRedirectToResults).toBe(true);
      expect(state.results).toEqual(expect.objectContaining({
        quizId: sampleQuiz.id,
        slug: sampleQuiz.slug,
        title: sampleQuiz.title,
        score: 33.33,
        totalQuestions: 3
      }));
    });

    test('should clear state with clearQuizState', () => {
      const store = setupStore({
        quizId: sampleQuiz.id,
        slug: sampleQuiz.slug,
        title: sampleQuiz.title,
        questions: sampleQuiz.questions,
        isCompleted: true,
        status: 'completed'
      });
      
      store.dispatch(clearQuizState());
      
      const state = store.getState().flashcard;
      
      expect(state.quizId).toBeNull();
      expect(state.slug).toBeNull();
      expect(state.title).toBe("");
      expect(state.questions).toEqual([]);
      expect(state.status).toBe('idle');
      expect(state.isCompleted).toBe(false);
    });
  });
  describe('Async thunks', () => {
    test('fetchFlashCardQuiz should fetch quiz data', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: sampleQuiz.id,
          title: sampleQuiz.title,
          flashCards: sampleQuiz.questions
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const store = setupStore();
      await store.dispatch(fetchFlashCardQuiz(sampleQuiz.slug));
      
      const state = store.getState().flashcard;
      
      expect(state.status).toBe('succeeded');
      expect(state.quizId).toBe(sampleQuiz.id);
      expect(state.slug).toBe(sampleQuiz.slug);
      expect(state.title).toBe(sampleQuiz.title);
      expect(state.questions).toEqual(sampleQuiz.questions);
      
      expect(fetch).toHaveBeenCalledWith(`/api/quizzes/flashcard/${sampleQuiz.slug}`);
    });
    
    test('fetchFlashCardQuiz should handle errors', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ message: 'Quiz not found' })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);
      
      const store = setupStore();
      await store.dispatch(fetchFlashCardQuiz(sampleQuiz.slug));
      
      const state = store.getState().flashcard;
      
      expect(state.status).toBe('failed');
      expect(state.error).toBeTruthy();
    });

    test('saveFlashCardResults should save quiz results', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          score: 75
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const answer = { questionId: '1', answer: 'correct' as any, timeSpent: 10 };
      
      const store = setupStore();
      await store.dispatch(saveFlashCardResults({ 
        slug: sampleQuiz.slug, 
        data: [answer] 
      }));
      
      const state = store.getState().flashcard;
      
      expect(fetch).toHaveBeenCalledWith(`/api/quizzes/common/${sampleQuiz.slug}/complete`, expect.any(Object));
      expect(state.status).toBe('succeeded');
    });
    
    test('saveFlashCardResults should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          message: 'Server error'
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const store = setupStore({
        results: {
          quizId: 'quiz-123',
          score: 80,
          totalQuestions: 10,
          correctCount: 8,
          incorrectCount: 2,
          stillLearningCount: 0,
          totalTime: 120,
          slug: 'test-quiz',
          title: 'Test Quiz',
          percentage: 80,
          reviewCards: [],
          stillLearningCards: [],
          completedAt: '2025-06-21T10:00:00Z',
          questions: []
        } as any
      });
      
      await store.dispatch(saveFlashCardResults({ 
        slug: sampleQuiz.slug, 
        data: { score: 80 } 
      }));
      
      const state = store.getState().flashcard;
      expect(state.status).toBe('completed_with_errors');
      expect(state.results?.error).toBeDefined();
      expect(state.results?.savedLocally).toBe(true);
    });
    
    test('saveFlashCardResultsLocally should save to localStorage', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        removeItem: jest.fn(),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', { 
        value: mockLocalStorage,
        writable: true 
      });
      
      const resultsData = {
        score: 85,
        totalQuestions: 10,
        correctAnswers: 8.5,
        percentage: 85
      };
      
      const store = setupStore();
      await store.dispatch(saveFlashCardResultsLocally({ 
        slug: 'test-quiz', 
        data: resultsData 
      }));
      
      // Check localStorage was called with correct key and data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PENDING_QUIZ_RESULTS.toString(),
        expect.stringContaining('test-quiz')
      );
      
      const state = store.getState().flashcard;
      expect(state.results?.savedLocally).toBe(true);
    });
    
    test('saveFlashCardResultsLocally should handle errors', async () => {
      // Mock localStorage with an error
      Object.defineProperty(window, 'localStorage', { 
        value: {
          setItem: jest.fn().mockImplementation(() => {
            throw new Error('Storage error');
          })
        },
        writable: true 
      });
      
      const store = setupStore();
      const action = await store.dispatch(saveFlashCardResultsLocally({ 
        slug: 'test-quiz', 
        data: { score: 100 } 
      }));
      
      expect(action.type).toContain('rejected');
    });
  });
  // Helper function to make selectors work with our test store
  const applySelector = <T>(selector: (state: any) => T, state: ReturnType<typeof setupStore>['getState']) => {
    return selector(state() as any);
  };

  describe('Selectors', () => {
    test('selectQuizQuestions should return questions', () => {
      const store = setupStore({
        questions: sampleQuiz.questions
      });
      
      const questions = applySelector(selectQuizQuestions, store.getState);
      expect(questions).toEqual(sampleQuiz.questions);
    });
    
    test('selectIsQuizComplete should return completion status', () => {
      const store = setupStore({
        isCompleted: true
      });
      
      const isComplete = applySelector(selectIsQuizComplete, store.getState);
      expect(isComplete).toBe(true);
    });
    
    test('selectQuizTitle should return title', () => {
      const store = setupStore({
        title: sampleQuiz.title
      });
      
      const title = applySelector(selectQuizTitle, store.getState);
      expect(title).toBe(sampleQuiz.title);
    });
    
    test('selectCurrentQuestionIndex should return current index', () => {
      const store = setupStore({
        currentQuestion: 2
      });
      
      const currentIndex = applySelector(selectCurrentQuestionIndex, store.getState);
      expect(currentIndex).toBe(2);
    });
    
    test('selectAnswers should return answers', () => {
      const answers = [
        { 
          questionId: '1', 
          answer: 'correct' as "correct" | "incorrect" | "still_learning", 
          isCorrect: true, 
          timeSpent: 10 
        },
        { 
          questionId: '2', 
          answer: 'incorrect' as "correct" | "incorrect" | "still_learning", 
          isCorrect: false, 
          timeSpent: 15 
        }
      ];
      
      const store = setupStore({
        answers
      });
      
      const selectedAnswers = applySelector(selectAnswers, store.getState);
      expect(selectedAnswers).toEqual(answers);
    });
    
    test('selectShouldRedirectToResults should return redirect flag', () => {
      const store = setupStore({
        shouldRedirectToResults: true
      });
      
      const shouldRedirect = applySelector(selectShouldRedirectToResults, store.getState);
      expect(shouldRedirect).toBe(true);
    });    test('selectCompleteResults should compile results from state', () => {
      const store = setupStore({
        quizId: sampleQuiz.id,
        slug: sampleQuiz.slug,
        title: sampleQuiz.title,
        questions: sampleQuiz.questions,
        answers: [
          { questionId: '1', answer: 'correct' as "correct", isCorrect: true, timeSpent: 10 },
          { questionId: '2', answer: 'incorrect' as "incorrect", isCorrect: false, timeSpent: 15 },
          { questionId: '3', answer: 'still_learning' as "still_learning", isCorrect: false, timeSpent: 12 }
        ]
      });
      
      const results = applySelector(selectCompleteResults, store.getState);
      
      expect(results).toBeDefined();
      expect(results.quizId).toBe(sampleQuiz.id);
      expect(results.slug).toBe(sampleQuiz.slug);
      expect(results.title).toBe(sampleQuiz.title);
      expect(results.correctAnswers).toBe(1);
      expect(results.stillLearningAnswers).toBe(1);
      expect(results.incorrectAnswers).toBe(1);
      expect(results.totalQuestions).toBe(3);
      expect(results.percentage).toBe(33); // 1 out of 3 correct, rounded
    });
    
    test('selectFlashcardAnswerBreakdown should return answer counts', () => {
      const store = setupStore({
        answers: [
          { questionId: '1', answer: 'correct' as "correct", isCorrect: true, timeSpent: 10 },
          { questionId: '2', answer: 'incorrect' as "incorrect", isCorrect: false, timeSpent: 15 },
          { questionId: '3', answer: 'still_learning' as "still_learning", isCorrect: false, timeSpent: 12 },
          { questionId: '4', answer: 'correct' as "correct", isCorrect: true, timeSpent: 5 }
        ]
      });
      
      const breakdown = applySelector(selectFlashcardAnswerBreakdown, store.getState);
      
      expect(breakdown.correct).toBe(2);
      expect(breakdown.incorrect).toBe(1);
      expect(breakdown.stillLearning).toBe(1);
    });
    
    test('selectProcessedResults should process answer data correctly', () => {
      const store = setupStore({
        answers: [
          { questionId: '1', answer: 'correct' as "correct", isCorrect: true, timeSpent: 10 },
          { questionId: '2', answer: 'incorrect' as "incorrect", isCorrect: false, timeSpent: 15 },
          { questionId: '3', answer: 'still_learning' as "still_learning", isCorrect: false, timeSpent: 12 }
        ]
      });
      
      const processed = applySelector(selectProcessedResults, store.getState);
      
      expect(processed.correctCount).toBe(1);
      expect(processed.incorrectCount).toBe(1);
      expect(processed.stillLearningCount).toBe(1);
      expect(processed.totalCount).toBe(3);
      expect(processed.reviewCards).toHaveLength(1);
      expect(processed.stillLearningCards).toHaveLength(1);
    });
  });
  describe('Edge cases and inconsistent state', () => {
    test('should handle inconsistent state with isCompleted=true but shouldRedirectToResults=false', () => {
      const store = setupStore({
        isCompleted: true,
        shouldRedirectToResults: false,
        slug: null,
        results: {
          slug: 'microservice-architecture-6339',
          score: 0,
          percentage: 0,
          correctAnswers: 0,
          totalQuestions: 1,
          completedAt: '2025-06-21T13:29:25.155Z',
          answers: [],
          reviewCards: [],
          stillLearningCards: [],
          questions: [],
          correctCount: 0,
          incorrectCount: 0,
          stillLearningCount: 0,
          totalTime: 0,
          quizId: ''
        } as any
      });
      
      const state = store.getState().flashcard;
      const results = applySelector(selectCompleteResults, store.getState);
      
      expect(state.isCompleted).toBe(true);
      expect(state.shouldRedirectToResults).toBe(false);
      expect(state.slug).toBeNull();
      expect(results.slug).toBe('microservice-architecture-6339');
      
      // This test helps verify that our component enhancements
      // can properly handle this edge case
    });
    
    test('should handle empty answers array', () => {
      const store = setupStore({
        answers: []
      });
      
      const results = applySelector(selectCompleteResults, store.getState);
      
      expect(results.correctAnswers).toBe(0);
      expect(results.incorrectAnswers).toBe(0);
      expect(results.stillLearningAnswers).toBe(0);
      expect(results.percentage).toBe(0);
    });  });
  
  describe('Auth-related actions', () => {
    test('should handle setRequiresFlashCardAuth action', () => {
      const store = setupStore();
      
      store.dispatch(setRequiresFlashCardAuth(true));
      
      const state = store.getState().flashcard;
      expect(state.requiresAuth).toBe(true);
      
      store.dispatch(setRequiresFlashCardAuth(false));
      expect(store.getState().flashcard.requiresAuth).toBe(false);
    });
    
    test('should handle setPendingFlashCardAuth action', () => {
      const store = setupStore();
      
      store.dispatch(setPendingFlashCardAuth(true));
      
      const state = store.getState().flashcard;
      expect(state.pendingAuthRequired).toBe(true);
      
      store.dispatch(setPendingFlashCardAuth(false));
      expect(store.getState().flashcard.pendingAuthRequired).toBe(false);
    });
    
    test('should handle restoreResultsAfterAuth action', () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        removeItem: jest.fn(),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', { 
        value: mockLocalStorage,
        writable: true 
      });
      
      // Setup mock storage data
      const storedData = {
        slug: 'test-quiz',
        quizType: 'flashcard',
        results: {
          quizId: 'quiz-123',
          slug: 'test-quiz',
          title: 'Test Quiz',
          correctCount: 2,
          incorrectCount: 1,
          stillLearningCount: 0,
          totalTime: 45,
          totalQuestions: 3,
          score: 2,
          percentage: 66,
          reviewCards: [1],
          stillLearningCards: [],
          completedAt: '2025-06-21T14:30:00Z'
        },
        questions: [{ id: '1', question: 'Q1', answer: 'A1', options: ['A1', 'B1'] }],
        answers: [{ questionId: '1', answer: 'correct', isCorrect: true }],
        isCompleted: true
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const store = setupStore();
      store.dispatch(restoreResultsAfterAuth({ slug: 'test-quiz' }));
      
      const state = store.getState().flashcard;
      expect(state.isCompleted).toBe(true);
      expect(state.slug).toBe('test-quiz');
      expect(state.requiresAuth).toBe(false);
      expect(state.pendingAuthRequired).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });
  
  describe('State management actions', () => {
    test('should handle savePendingResults action', () => {
      const store = setupStore({
        slug: 'pending-quiz',
        quizId: 'quiz-123',
        title: 'Pending Quiz',
        questions: sampleQuiz.questions,
        answers: [{ questionId: '1', answer: 'correct' as "correct" }],
        isCompleted: true,
        results: {
          correctCount: 1,
          incorrectCount: 0,
          stillLearningCount: 0,
          totalTime: 25,
          totalQuestions: 1,
          score: 100,
          percentage: 100,
          completedAt: '2025-06-21T15:00:00Z',
          quizId: 'quiz-123',
          slug: 'pending-quiz',
          title: 'Pending Quiz',
          reviewCards: [],
          stillLearningCards: [],
          questions: []
        } as any
      });
      
      store.dispatch(savePendingResults());
      
      // Check that localStorage was called with the expected data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PENDING_QUIZ_RESULTS.toString(),
        expect.stringContaining('pending-quiz')
      );
      
      // Check that the results in state were updated
      const state = store.getState().flashcard;
      expect(state.results?.savedLocally).toBe(true);
    });
    
    test('should handle resetRedirectFlag action', () => {
      const store = setupStore({
        shouldRedirectToResults: true
      });
      
      store.dispatch(resetRedirectFlag());
      
      const state = store.getState().flashcard;
      expect(state.shouldRedirectToResults).toBe(false);
    });
  });
  
  describe('Reset actions', () => {
    test('should handle resetFlashCards action', () => {
      const store = setupStore({
        quizId: 'quiz-123',
        slug: 'test-quiz',
        title: 'Test Quiz',
        questions: sampleQuiz.questions,
        currentQuestion: 2,
        answers: [{ questionId: '1', answer: 'correct' as "correct", isCorrect: true }],
        status: 'succeeded' as "succeeded",
        isCompleted: true,
        results: { score: 100 } as any
      });
      
      store.dispatch(resetFlashCards());
      
      const state = store.getState().flashcard;
      expect(state.quizId).toBeNull();
      expect(state.slug).toBeNull();
      expect(state.title).toBe('');
      expect(state.questions).toEqual([]);
      expect(state.currentQuestion).toBe(0);
      expect(state.answers).toEqual([]);
      expect(state.isCompleted).toBe(false);
      expect(state.results).toBeNull();
    });
    
    test('should not reset when in processing state', () => {
      const store = setupStore({
        quizId: 'quiz-123',
        status: 'submitting' as "submitting",
        isCompleted: true
      });
      
      store.dispatch(resetFlashCards());
      
      const state = store.getState().flashcard;
      // Should not reset when in submitting state
      expect(state.quizId).toBe('quiz-123');
      expect(state.isCompleted).toBe(true);
    });
    
    test('should handle forceResetFlashCards action regardless of state', () => {
      const store = setupStore({
        quizId: 'quiz-123',
        status: 'submitting' as "submitting",
        isCompleted: true
      });
      
      store.dispatch(forceResetFlashCards());
      
      const state = store.getState().flashcard;
      expect(state.quizId).toBeNull();
      expect(state.status).toBe('idle');
      expect(state.isCompleted).toBe(false);
    });
  });
    describe('completeQuiz action', () => {
    test('should calculate results from answers', () => {
      const store = setupStore({
        quizId: 'quiz-123',
        slug: 'test-quiz',
        title: 'Test Quiz',
        questions: sampleQuiz.questions,
        answers: [
          { questionId: '1', answer: 'correct' as "correct", isCorrect: true, timeSpent: 10 },
          { questionId: '2', answer: 'incorrect' as "incorrect", isCorrect: false, timeSpent: 15 },
          { questionId: '3', answer: 'still_learning' as "still_learning", isCorrect: false, timeSpent: 20 }
        ]
      });
      
      store.dispatch(completeQuiz({ totalTime: 45 }));
      
      const state = store.getState().flashcard;
      expect(state.isCompleted).toBe(true);
      expect(state.status).toBe('completed');
      expect(state.shouldRedirectToResults).toBe(true);
      
      expect(state.results).toBeDefined();
      expect(state.results?.correctCount).toBe(1);
      expect(state.results?.incorrectCount).toBe(1);
      expect(state.results?.stillLearningCount).toBe(1);
      expect(state.results?.totalTime).toBe(45);
      expect(state.results?.percentage).toBeGreaterThan(0);
      
      // Check that localStorage is updated with results
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.FLASHCARD_RESULTS,
        expect.any(String)
      );
    });
    
    test('should handle missing answers gracefully', () => {
      const store = setupStore({
        quizId: 'quiz-123',
        slug: 'test-quiz',
        questions: sampleQuiz.questions,
        answers: []
      });
      
      store.dispatch(completeQuiz({ totalTime: 30 }));
      
      const state = store.getState().flashcard;
      expect(state.isCompleted).toBe(true);
      expect(state.results?.correctCount).toBe(0);
      expect(state.results?.totalQuestions).toBe(3);
      // Unanswered questions should count as incorrect
      expect(state.results?.incorrectCount).toBe(3);
    });
    
    test('should handle malformed answers array gracefully', () => {
      const store = setupStore({
        quizId: 'quiz-123',
        slug: 'test-quiz',
        questions: sampleQuiz.questions,
        // Invalid answers with missing properties but should still work
        answers: [
          { questionId: '1' } as any, 
          { } as any,
          { answer: 'correct' } as any
        ]
      });
      
      store.dispatch(completeQuiz({ totalTime: 10 }));
      
      const state = store.getState().flashcard;
      expect(state.isCompleted).toBe(true);
      // All answers should be considered incorrect
      expect(state.results?.correctCount).toBe(0);
      expect(state.results?.incorrectCount).toBe(3);
    });
    
    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage with an error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const store = setupStore({
        quizId: 'quiz-123',
        slug: 'test-quiz',
        questions: sampleQuiz.questions,
        answers: [
          { questionId: '1', answer: 'correct' as "correct" }
        ]
      });
      
      // Should not throw error despite localStorage failing
      expect(() => {
        store.dispatch(completeQuiz({ totalTime: 5 }));
      }).not.toThrow();
      
      const state = store.getState().flashcard;
      expect(state.isCompleted).toBe(true);
      expect(state.status).toBe('completed');
    });
  });
});
