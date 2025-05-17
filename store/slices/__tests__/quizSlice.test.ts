import quizReducer, {
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  decrementTimer,
  markQuizCompleted,
  submitQuiz,
} from '../quizSlice';
import { configureStore } from '@reduxjs/toolkit';

// Sample quiz data for testing
const sampleQuizData = {
  id: 'quiz-123',
  title: 'Test Quiz',
  slug: 'test-quiz',
  type: 'mcq',
  questions: [
    {
      id: 'q1',
      question: 'What is 1+1?',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      type: 'mcq',
    },
  ],
  isPublic: true,
  isFavorite: false,
  ownerId: 'user-123',
};

// Test initial state
const initialState = {
  quizData: null,
  currentQuestion: 0,
  userAnswers: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  quizError: null,
  submissionError: null,
  resultsError: null,
  historyError: null,
  results: null,
  isCompleted: false,
  quizHistory: [],
  currentQuizId: null,
  timeRemaining: null,
  timerActive: false,
  submissionStateInProgress: false,
  errors: {
    quiz: null,
    submission: null,
    results: null,
    history: null,
  },
};

describe('quizSlice', () => {
  test('should return the initial state', () => {
    const state = quizReducer(undefined, { type: 'unknown' });
    expect(state).toEqual(initialState);
  });

  test('should handle resetQuizState', () => {
    // Setup state with some data
    const stateWithData = {
      ...initialState,
      quizData: sampleQuizData,
      currentQuestion: 2,
      userAnswers: [{ questionId: 'q1', answer: '2' }],
      quizHistory: [{ id: 'history-1', quizTitle: 'Past Quiz', score: 10, maxScore: 10 }],
    };

    // Reset state
    const newState = quizReducer(stateWithData, resetQuizState());

    // History should be preserved, everything else reset
    expect(newState).toEqual({
      ...initialState,
      quizHistory: stateWithData.quizHistory,
    });
  });

  test('should handle setCurrentQuestion', () => {
    const newQuestion = 2;
    const state = quizReducer(initialState, setCurrentQuestion(newQuestion));

    expect(state.currentQuestion).toEqual(newQuestion);
  });

  test('should handle setUserAnswer for new answer', () => {
    const answer = { questionId: 'q1', answer: '2' };
    const state = quizReducer(initialState, setUserAnswer(answer));

    expect(state.userAnswers).toContainEqual(answer);
  });

  test('should handle setUserAnswer for existing answer', () => {
    const initialAnswers = [
      { questionId: 'q1', answer: '1' },
      { questionId: 'q2', answer: '3' },
    ];

    const stateWithAnswers = {
      ...initialState,
      userAnswers: [...initialAnswers],
    };

    // Update the first answer
    const updatedAnswer = { questionId: 'q1', answer: '2' };
    const state = quizReducer(stateWithAnswers, setUserAnswer(updatedAnswer));

    expect(state.userAnswers).toContainEqual(updatedAnswer);
    expect(state.userAnswers).toContainEqual(initialAnswers[1]);
    expect(state.userAnswers).toHaveLength(2);
  });

  test('should handle timer actions', () => {
    // Setup quiz with time limit
    const stateWithTimeLimit = {
      ...initialState,
      quizData: {
        ...sampleQuizData,
        timeLimit: 30, // 30 minutes
      },
    };

    // Start timer
    let state = quizReducer(stateWithTimeLimit, startTimer());
    expect(state.timeRemaining).toEqual(30 * 60); // 30 minutes in seconds
    expect(state.timerActive).toBe(true);

    // Pause timer
    state = quizReducer(state, pauseTimer());
    expect(state.timerActive).toBe(false);

    // Resume timer
    state = quizReducer(state, resumeTimer());
    expect(state.timerActive).toBe(true);

    // Decrement timer
    state = quizReducer(state, decrementTimer());
    expect(state.timeRemaining).toEqual(30 * 60 - 1);
  });

  test('should handle markQuizCompleted', () => {
    const results = {
      quizId: 'quiz-123',
      score: 8,
      maxScore: 10,
      percentage: 80,
      completedAt: '2023-01-01T12:00:00Z',
      questions: [],
    };

    const state = quizReducer(initialState, markQuizCompleted(results));

    expect(state.results).toEqual(results);
    expect(state.isCompleted).toBe(true);
    expect(state.timerActive).toBe(false);
  });

  test('should handle submitQuiz action', async () => {
    // Mock store with thunk middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
    });

    // Mock response data
    const responseData = {
      score: 8,
      maxScore: 10,
      percentage: 80,
      submittedAt: '2023-01-01T12:00:00Z',
      questions: [],
    };

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseData),
    });

    // Set initial state
    store.dispatch({
      type: 'quiz/fetchQuiz/fulfilled',
      payload: sampleQuizData,
    });

    // Submit quiz
    await store.dispatch(
      submitQuiz({
        slug: 'test-quiz',
        quizId: 'quiz-123',
        type: 'mcq',
        answers: [{ questionId: 'q1', answer: '2' }],
      })
    );

    // Get final state
    const state = store.getState().quiz;

    // Verify submission effects
    expect(state.isCompleted).toBe(true);
    expect(state.isSubmitting).toBe(false);
    expect(state.results).toBeTruthy();
    expect(state.timerActive).toBe(false);

    // Clean up
    jest.restoreAllMocks();
  });
});
