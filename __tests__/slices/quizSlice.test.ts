import { configureStore } from '@reduxjs/toolkit';
import quizReducer, {
  initialState,
  setCurrentQuestion,
  setUserAnswer,
  resetQuizState,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
  setError,
  clearErrors,
  fetchQuiz,
  submitQuiz,
  selectCurrentQuestionData,
  selectQuizProgress,
  selectIsLastQuestion,
  QuizState,
  FetchQuizParams,
  SubmitQuizParams
} from '@/store/slices/quizSlice';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid for consistent test results
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

// Mock fetch for async thunks
global.fetch = jest.fn();

describe('Quiz Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { quiz: quizReducer },
    });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Reducers', () => {
    it('should handle initial state', () => {
      expect(quizReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle resetQuizState', () => {
      const quizHistory = [{ id: '1', score: 10 }];
      const state = {
        ...initialState,
        quizHistory,
        currentQuestion: 5,
        isCompleted: true,
      };

      const newState = quizReducer(state as QuizState, resetQuizState());
      expect(newState).toEqual({
        ...initialState,
        quizHistory,
      });
    });

    it('should handle setCurrentQuestion with valid index', () => {
      const state = {
        ...initialState,
        quizData: {
          questions: [{ id: '1' }, { id: '2' }, { id: '3' }],
        } as any,
      };

      const newState = quizReducer(state as QuizState, setCurrentQuestion(1));
      expect(newState.currentQuestion).toBe(1);
    });

    it('should not set currentQuestion to invalid index', () => {
      const state = {
        ...initialState,
        quizData: {
          questions: [{ id: '1' }, { id: '2' }],
        } as any,
        currentQuestion: 0,
      };

      // Test negative index
      let newState = quizReducer(state as QuizState, setCurrentQuestion(-1));
      expect(newState.currentQuestion).toBe(0);

      // Test out of bounds index
      newState = quizReducer(state as QuizState, setCurrentQuestion(5));
      expect(newState.currentQuestion).toBe(0);
    });

    it('should handle setUserAnswer for new answer', () => {
      const answer = { questionId: '1', answer: 'test' };
      const newState = quizReducer(initialState, setUserAnswer(answer));
      expect(newState.userAnswers).toEqual([answer]);
    });

    it('should handle setUserAnswer for existing answer', () => {
      const initialAnswer = { questionId: '1', answer: 'initial' };
      const updatedAnswer = { questionId: '1', answer: 'updated' };
      const state = {
        ...initialState,
        userAnswers: [initialAnswer],
      };

      const newState = quizReducer(state as QuizState, setUserAnswer(updatedAnswer));
      expect(newState.userAnswers).toEqual([updatedAnswer]);
    });

    it('should handle timer actions', () => {
      // Test startTimer
      let state = {
        ...initialState,
        quizData: { timeLimit: 10 } as any,
      };
      let newState = quizReducer(state as QuizState, startTimer());
      expect(newState.timeRemaining).toBe(600); // 10 minutes in seconds
      expect(newState.timerActive).toBe(true);

      // Test pauseTimer
      newState = quizReducer(newState, pauseTimer());
      expect(newState.timerActive).toBe(false);

      // Test resumeTimer
      newState = quizReducer(newState, resumeTimer());
      expect(newState.timerActive).toBe(true);

      // Test decrementTimer
      newState = quizReducer(newState, decrementTimer());
      expect(newState.timeRemaining).toBe(599);
    });

    it('should handle markQuizCompleted', () => {
      const results = { score: 10 } as any;
      const newState = quizReducer(initialState, markQuizCompleted(results));
      expect(newState.results).toEqual(results);
      expect(newState.isCompleted).toBe(true);
      expect(newState.timerActive).toBe(false);
      expect(newState.timeRemaining).toBe(0);
    });

    it('should handle setError and clearErrors', () => {
      // Test setError
      let newState = quizReducer(
        initialState,
        setError({ type: 'quiz', message: 'Quiz error' })
      );
      expect(newState.errors.quiz).toBe('Quiz error');

      // Test another error type
      newState = quizReducer(
        newState,
        setError({ type: 'submission', message: 'Submission error' })
      );
      expect(newState.errors.submission).toBe('Submission error');
      expect(newState.errors.quiz).toBe('Quiz error');

      // Test clearErrors
      newState = quizReducer(newState, clearErrors());
      expect(newState.errors).toEqual({
        quiz: null,
        submission: null,
        results: null,
        history: null,
      });
    });
  });

  describe('Async Thunks', () => {
    it('should handle fetchQuiz.fulfilled', async () => {
      const mockQuizData = {
        quizId: '123',
        quizData: {
          title: 'Test Quiz',
          questions: [
            {
              id: 'q1',
              question: 'Question 1',
              options: ['A', 'B', 'C'],
              correctAnswer: 'A',
            },
          ],
        },
        isPublic: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQuizData),
      });

      const result = await store.dispatch(
        fetchQuiz({ slug: 'test-quiz', type: 'mcq' })
      );

      expect(result.type).toBe('quiz/fetchQuiz/fulfilled');
      expect(result.payload).toEqual(expect.objectContaining({
        id: '123',
        title: 'Test Quiz',
        slug: 'test-quiz',
        type: 'mcq',
      }));

      const state = (store.getState() as { quiz: QuizState }).quiz;
      expect(state.quizData).toEqual(result.payload);
      expect(state.currentQuizId).toBe('123');
      expect(state.isLoading).toBe(false);
    });

    it('should handle fetchQuiz.rejected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Quiz not found' }),
      });

      const result = await store.dispatch(
        fetchQuiz({ slug: 'nonexistent', type: 'mcq' })
      );

      expect(result.type).toBe('quiz/fetchQuiz/rejected');
      
      const state = store.getState().quiz;
      expect(state.isLoading).toBe(false);
      expect(state.errors.quiz).toBe('Quiz not found');
    });

    it('should handle fetchQuiz network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      const result = await store.dispatch(
        fetchQuiz({ slug: 'test-quiz', type: 'mcq' })
      );

      expect(result.type).toBe('quiz/fetchQuiz/rejected');
      
      const state = store.getState().quiz;
      expect(state.isLoading).toBe(false);
      expect(state.errors.quiz).toBe('Network error: Please check your connection');
    });

    it('should handle submitQuiz.fulfilled', async () => {
      const mockResult = {
        score: 8,
        totalQuestions: 10,
        correctAnswers: 8,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await store.dispatch(
        submitQuiz({
          slug: 'test-quiz',
          type: 'mcq',
          answers: [{ questionId: 'q1', answer: 'A', isCorrect: true }],
        })
      );

      expect(result.type).toBe('quiz/submitQuiz/fulfilled');
      expect(result.payload).toEqual(mockResult);

      const state = store.getState().quiz;
      expect(state.isSubmitting).toBe(false);
      expect(state.isCompleted).toBe(true);
      expect(state.results).toEqual(mockResult);
    });

    it('should handle submitQuiz.rejected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: () => Promise.resolve({ message: 'Internal server error' }),
      });

      const result = await store.dispatch(
        submitQuiz({
          slug: 'test-quiz',
          type: 'mcq',
          answers: [{ questionId: 'q1', answer: 'A', isCorrect: true }],
        })
      );

      expect(result.type).toBe('quiz/submitQuiz/rejected');
      
      const state = store.getState().quiz;
      expect(state.isSubmitting).toBe(false);
      expect(state.errors.submission).toBe('Internal server error');
    });
  });

  describe('Selectors', () => {
    it('should select current question data', () => {
      const state = {
        quiz: {
          quizData: {
            questions: [
              { id: 'q1', question: 'Question 1' },
              { id: 'q2', question: 'Question 2' },
            ],
          },
          currentQuestion: 1,
        },
      };

      const result = selectCurrentQuestionData(state);
      expect(result).toEqual({ id: 'q2', question: 'Question 2' });
    });

    it('should return null for invalid current question', () => {
      const state = {
        quiz: {
          quizData: {
            questions: [{ id: 'q1', question: 'Question 1' }],
          },
          currentQuestion: 5, // Out of bounds
        },
      };

      const result = selectCurrentQuestionData(state);
      expect(result).toBeNull();
    });

    it('should calculate quiz progress correctly', () => {
      const state = {
        quiz: {
          quizData: {
            questions: new Array(10).fill({}), // 10 questions
          },
          currentQuestion: 4, // 5th question (0-indexed)
        },
      };

      const result = selectQuizProgress(state);
      expect(result).toBe(50); // 5/10 * 100 = 50%
    });

    it('should handle empty questions array for progress', () => {
      const state = {
        quiz: {
          quizData: {
            questions: [],
          },
          currentQuestion: 0,
        },
      };

      const result = selectQuizProgress(state);
      expect(result).toBe(0);
    });

    it('should detect last question correctly', () => {
      const state = {
        quiz: {
          quizData: {
            questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }],
          },
          currentQuestion: 2, // Last question (0-indexed)
        },
      };

      const result = selectIsLastQuestion(state);
      expect(result).toBe(true);
    });

    it('should detect non-last question correctly', () => {
      const state = {
        quiz: {
          quizData: {
            questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }],
          },
          currentQuestion: 1, // Middle question
        },
      };

      const result = selectIsLastQuestion(state);
      expect(result).toBe(false);
    });
  });
});
