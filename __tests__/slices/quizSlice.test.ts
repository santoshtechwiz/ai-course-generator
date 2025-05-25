import { configureStore } from '@reduxjs/toolkit';
import quizReducer, {
  setQuizId,
  setQuizType,
  setCurrentQuestionIndex,
  setAnswer,
  clearAnswers,
  setSessionId,
  setLastSaved,
  resetQuiz,
  clearQuiz,
  saveAuthRedirectState,
  clearAuthRedirectState,
  fetchQuiz,
  saveAnswer,
  submitQuiz,
  recoverSession,
  QuizState,
  MCQQuestion,
  MCQAnswer
} from '@/store/slices/quizSlice';

// Mock the session utilities
jest.mock('../utils/session', () => ({
  generateSessionId: jest.fn(() => 'test-session-id'),
  saveQuizResults: jest.fn(),
  saveQuizSession: jest.fn(),
  getQuizSession: jest.fn(),
  clearQuizSession: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Quiz Slice', () => {
  // Setup initial state for tests
  const initialState: QuizState = {
    quizId: null,
    quizType: null,
    title: null,
    description: null,
    questions: [],
    totalQuestions: 0,
    currentQuestionIndex: 0,
    answers: {},
    status: 'idle',
    error: null,
    results: null,
    sessionId: null,
    lastSaved: null,
    authRedirectState: null
  };

  // Sample quiz data for tests
  const sampleQuiz = {
    id: 'quiz-123',
    type: 'mcq',
    title: 'Test Quiz',
    description: 'A test quiz for unit testing',
    questions: [
      {
        id: 'q1',
        text: 'What is Redux?',
        type: 'mcq',
        options: [
          { id: 'opt1', text: 'A state management library' },
          { id: 'opt2', text: 'A UI framework' },
          { id: 'opt3', text: 'A database' }
        ],
        correctOptionId: 'opt1'
      },
      {
        id: 'q2',
        text: 'What is a reducer?',
        type: 'mcq',
        options: [
          { id: 'opt1', text: 'A function that updates state' },
          { id: 'opt2', text: 'A UI component' },
          { id: 'opt3', text: 'A database query' }
        ],
        correctOptionId: 'opt1'
      }
    ]
  };

  // Sample answer for tests
  const sampleAnswer: MCQAnswer = {
    questionId: 'q1',
    selectedOptionId: 'opt1',
    timestamp: Date.now()
  };

  // Helper to create a mock store
  const createMockStore = (preloadedState = {}) => {
    return configureStore({
      reducer: { quiz: quizReducer },
      preloadedState: { quiz: { ...initialState, ...preloadedState } }
    });
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return the initial state', () => {
      const state = quizReducer(undefined, { type: undefined });
      expect(state).toEqual(initialState);
    });
  });

  describe('Reducers', () => {
    it('should handle setQuizId', () => {
      const state = quizReducer(initialState, setQuizId('quiz-123'));
      expect(state.quizId).toBe('quiz-123');
    });

    it('should handle setQuizType', () => {
      const state = quizReducer(initialState, setQuizType('mcq'));
      expect(state.quizType).toBe('mcq');
    });

    it('should handle setCurrentQuestionIndex', () => {
      const state = quizReducer(initialState, setCurrentQuestionIndex(2));
      expect(state.currentQuestionIndex).toBe(2);
    });

    it('should handle setAnswer', () => {
      const state = quizReducer(initialState, setAnswer({ 
        questionId: 'q1', 
        answer: sampleAnswer 
      }));
      expect(state.answers['q1']).toEqual(sampleAnswer);
    });

    it('should handle clearAnswers', () => {
      const stateWithAnswers = {
        ...initialState,
        answers: { 'q1': sampleAnswer }
      };
      const state = quizReducer(stateWithAnswers, clearAnswers());
      expect(state.answers).toEqual({});
    });

    it('should handle setSessionId', () => {
      const state = quizReducer(initialState, setSessionId('session-123'));
      expect(state.sessionId).toBe('session-123');
    });

    it('should handle setLastSaved', () => {
      const timestamp = Date.now();
      const state = quizReducer(initialState, setLastSaved(timestamp));
      expect(state.lastSaved).toBe(timestamp);
    });

    it('should handle resetQuiz', () => {
      const stateToReset = {
        ...initialState,
        currentQuestionIndex: 3,
        answers: { 'q1': sampleAnswer },
        status: 'submitted',
        error: 'Some error',
        results: { score: 5, maxScore: 10, percentage: 50, questionResults: [], submittedAt: Date.now() }
      };
      const state = quizReducer(stateToReset, resetQuiz());
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.answers).toEqual({});
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.results).toBeNull();
    });

    it('should handle clearQuiz', () => {
      const stateWithQuiz = {
        ...initialState,
        quizId: 'quiz-123',
        quizType: 'mcq',
        title: 'Test Quiz',
        description: 'A test quiz',
        questions: [{ id: 'q1', text: 'Question 1', type: 'mcq' } as MCQQuestion],
        totalQuestions: 1,
        currentQuestionIndex: 0,
        answers: { 'q1': sampleAnswer },
        status: 'idle',
        error: null,
        results: null
      };
      const state = quizReducer(stateWithQuiz, clearQuiz());
      expect(state.quizId).toBeNull();
      expect(state.quizType).toBeNull();
      expect(state.title).toBeNull();
      expect(state.description).toBeNull();
      expect(state.questions).toEqual([]);
      expect(state.totalQuestions).toBe(0);
      expect(state.answers).toEqual({});
    });

    it('should handle saveAuthRedirectState', () => {
      const redirectState = {
        slug: 'test-quiz',
        quizId: 'quiz-123',
        type: 'mcq',
        answers: { 'q1': sampleAnswer },
        currentQuestionIndex: 1,
        tempResults: { score: 5 }
      };
      const state = quizReducer(initialState, saveAuthRedirectState(redirectState));
      expect(state.authRedirectState).toEqual(redirectState);
    });

    it('should handle clearAuthRedirectState', () => {
      const stateWithRedirect = {
        ...initialState,
        authRedirectState: {
          slug: 'test-quiz',
          quizId: 'quiz-123',
          type: 'mcq',
          answers: { 'q1': sampleAnswer },
          currentQuestionIndex: 1,
          tempResults: { score: 5 }
        }
      };
      const state = quizReducer(stateWithRedirect, clearAuthRedirectState());
      expect(state.authRedirectState).toBeNull();
    });
  });

  describe('Async Thunks', () => {
    describe('fetchQuiz', () => {
      it('should handle fetchQuiz.pending', () => {
        const action = { type: fetchQuiz.pending.type };
        const state = quizReducer(initialState, action);
        expect(state.status).toBe('loading');
      });

      it('should handle fetchQuiz.fulfilled with provided data', () => {
        const action = { 
          type: fetchQuiz.fulfilled.type, 
          payload: sampleQuiz
        };
        const state = quizReducer(initialState, action);
        expect(state.quizId).toBe(sampleQuiz.id);
        expect(state.quizType).toBe(sampleQuiz.type);
        expect(state.title).toBe(sampleQuiz.title);
        expect(state.description).toBe(sampleQuiz.description);
        expect(state.questions).toEqual(sampleQuiz.questions);
        expect(state.totalQuestions).toBe(sampleQuiz.questions.length);
        expect(state.status).toBe('idle');
        expect(state.error).toBeNull();
      });

      it('should handle fetchQuiz.fulfilled with null payload', () => {
        const action = { 
          type: fetchQuiz.fulfilled.type, 
          payload: null
        };
        const state = quizReducer(initialState, action);
        expect(state.status).toBe('error');
        expect(state.error).toBe('No data received from server');
      });

      it('should handle fetchQuiz.rejected', () => {
        const action = { 
          type: fetchQuiz.rejected.type, 
          payload: 'Failed to fetch quiz'
        };
        const state = quizReducer(initialState, action);
        expect(state.status).toBe('error');
        expect(state.error).toBe('Failed to fetch quiz');
      });

      it('should fetch quiz data from API when no data is provided', async () => {
        // Mock successful fetch response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => sampleQuiz
        });

        const store = createMockStore();
        await store.dispatch(fetchQuiz({ id: 'quiz-123' }));
        
        const actions = store.getState().quiz;
        expect(actions.quizId).toBe(sampleQuiz.id);
        expect(actions.questions).toEqual(sampleQuiz.questions);
        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes/quiz-123');
      });

      it('should use provided data without API call when data is provided', async () => {
        const store = createMockStore();
        await store.dispatch(fetchQuiz({ id: 'quiz-123', data: sampleQuiz }));
        
        const actions = store.getState().quiz;
        expect(actions.quizId).toBe(sampleQuiz.id);
        expect(actions.questions).toEqual(sampleQuiz.questions);
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should handle API error', async () => {
        // Mock failed fetch response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404
        });

        const store = createMockStore();
        await store.dispatch(fetchQuiz({ id: 'quiz-123' }));
        
        const actions = store.getState().quiz;
        expect(actions.status).toBe('error');
        expect(actions.error).toBe('Failed to fetch quiz');
      });
    });

    describe('submitQuiz', () => {
      it('should handle submitQuiz.pending', () => {
        const action = { type: submitQuiz.pending.type };
        const state = quizReducer(initialState, action);
        expect(state.status).toBe('submitting');
      });

      it('should handle submitQuiz.fulfilled', () => {
        const results = {
          score: 1,
          maxScore: 2,
          percentage: 50,
          questionResults: [
            { questionId: 'q1', correct: true, feedback: 'Correct answer!' },
            { questionId: 'q2', correct: false, feedback: 'Incorrect answer' }
          ],
          submittedAt: Date.now()
        };
        
        const action = { 
          type: submitQuiz.fulfilled.type, 
          payload: results
        };
        
        const state = quizReducer(initialState, action);
        expect(state.status).toBe('submitted');
        expect(state.results).toEqual(results);
      });

      it('should handle submitQuiz.rejected', () => {
        const action = { 
          type: submitQuiz.rejected.type, 
          payload: 'Failed to submit quiz'
        };
        
        const state = quizReducer(initialState, action);
        expect(state.status).toBe('error');
        expect(state.error).toBe('Failed to submit quiz');
      });

      it('should calculate and submit quiz results', async () => {
        const stateWithQuiz = {
          quizId: 'quiz-123',
          quizType: 'mcq',
          questions: sampleQuiz.questions as MCQQuestion[],
          totalQuestions: sampleQuiz.questions.length,
          answers: {
            'q1': { questionId: 'q1', selectedOptionId: 'opt1', timestamp: Date.now() } as MCQAnswer,
            'q2': { questionId: 'q2', selectedOptionId: 'opt2', timestamp: Date.now() } as MCQAnswer
          },
          sessionId: 'test-session-id'
        };
        
        const store = createMockStore(stateWithQuiz);
        await store.dispatch(submitQuiz());
        
        const state = store.getState().quiz;
        expect(state.status).toBe('submitted');
        expect(state.results).toBeDefined();
        expect(state.results?.score).toBe(1); // One correct answer
        expect(state.results?.maxScore).toBe(2);
        expect(state.results?.percentage).toBe(50);
      });

      it('should reject when no quiz ID is found', async () => {
        const store = createMockStore();
        await store.dispatch(submitQuiz());
        
        const state = store.getState().quiz;
        expect(state.status).toBe('error');
        expect(state.error).toBe('No quiz ID found');
      });
    });

    describe('recoverSession', () => {
      it('should handle recoverSession.fulfilled with session data', () => {
        const sessionData = {
          sessionId: 'session-123',
          answers: { 'q1': sampleAnswer },
          lastSaved: Date.now()
        };
        
        const action = { 
          type: recoverSession.fulfilled.type, 
          payload: sessionData
        };
        
        const state = quizReducer(initialState, action);
        expect(state.sessionId).toBe(sessionData.sessionId);
        expect(state.answers).toEqual(sessionData.answers);
        expect(state.lastSaved).toBe(sessionData.lastSaved);
      });

      it('should handle recoverSession.fulfilled with null payload', () => {
        const action = { 
          type: recoverSession.fulfilled.type, 
          payload: null
        };
        
        const state = quizReducer(initialState, action);
        expect(state).toEqual(initialState); // State should not change
      });

      it('should recover session data and fetch quiz if needed', async () => {
        const sessionData = {
          quizId: 'quiz-123',
          answers: { 'q1': sampleAnswer },
          lastSaved: Date.now()
        };
        
        // Mock getQuizSession to return session data
        const { getQuizSession } = require('../utils/session');
        getQuizSession.mockReturnValueOnce(sessionData);
        
        // Mock successful fetch response for fetchQuiz
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => sampleQuiz
        });
        
        const store = createMockStore();
        await store.dispatch(recoverSession('session-123'));
        
        const state = store.getState().quiz;
        expect(state.sessionId).toBe('session-123');
        expect(state.answers).toEqual(sessionData.answers);
        expect(state.lastSaved).toBe(sessionData.lastSaved);
        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes/quiz-123');
      });

      it('should handle no session data', async () => {
        // Mock getQuizSession to return null
        const { getQuizSession } = require('../utils/session');
        getQuizSession.mockReturnValueOnce(null);
        
        const store = createMockStore();
        await store.dispatch(recoverSession('session-123'));
        
        const state = store.getState().quiz;
        expect(state).toEqual(initialState); // State should not change
      });
    });
  });

  describe('Selectors', () => {
    it('should select current question correctly', () => {
      const stateWithQuestions = {
        ...initialState,
        questions: sampleQuiz.questions,
        currentQuestionIndex: 1
      };
      
      const store = createMockStore(stateWithQuestions);
      const state = store.getState();
      
      // Import and test the selector
      const { selectCurrentQuestion } = require('./quizSlice');
      const currentQuestion = selectCurrentQuestion(state);
      
      expect(currentQuestion).toEqual(sampleQuiz.questions[1]);
    });

    it('should return null for current question when index is out of bounds', () => {
      const stateWithQuestions = {
        ...initialState,
        questions: sampleQuiz.questions,
        currentQuestionIndex: 5 // Out of bounds
      };
      
      const store = createMockStore(stateWithQuestions);
      const state = store.getState();
      
      // Import and test the selector
      const { selectCurrentQuestion } = require('./quizSlice');
      const currentQuestion = selectCurrentQuestion(state);
      
      expect(currentQuestion).toBeNull();
    });

    it('should select quiz results correctly', () => {
      const results = {
        score: 1,
        maxScore: 2,
        percentage: 50,
        questionResults: [],
        submittedAt: Date.now()
      };
      
      const stateWithResults = {
        ...initialState,
        results
      };
      
      const store = createMockStore(stateWithResults);
      const state = store.getState();
      
      // Import and test the selector
      const { selectQuizResults } = require('./quizSlice');
      const quizResults = selectQuizResults(state);
      
      expect(quizResults).toEqual(results);
    }); 
    it('should return null for quiz results when not available', () => {
      const store = createMockStore();
      const state = store.getState();
      
      // Import and test the selector
      const { selectQuizResults } = require('./quizSlice');
      const quizResults = selectQuizResults(state);
      
      expect(quizResults).toBeNull();
    });

  });
