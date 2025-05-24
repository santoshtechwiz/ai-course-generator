import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { quizSlice } from '@/store/slices/quizSlice';
import { signIn } from 'next-auth/react';
import { useQuiz } from '@/store';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock the dispatch and unwrap functions
jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(() => jest.fn(() => ({
    unwrap: jest.fn(),
  }))),
  useAppSelector: jest.fn((selector) => selector({
    quiz: {
      quizData: {
        id: 'test-quiz',
        title: 'Test Quiz',
        slug: 'test-quiz',
        type: 'mcq',
        questions: [
          { id: 'q1', question: 'Question 1' },
          { id: 'q2', question: 'Question 2' },
        ],
        isPublic: true,
        isFavorite: false,
        ownerId: 'owner1',
        timeLimit: 10,
      },
      currentQuestion: 0,
      userAnswers: [],
      isLoading: false,
      isSubmitting: false,
      isCompleted: false,
      timerActive: false,
      results: null,
      tempResults: null,
      errors: {
        quiz: null,
        submission: null,
        results: null,
        history: null,
      },
      currentQuizType: 'mcq',
      currentQuizSlug: 'test-quiz',
    }
  })),
}));

// Mock the slice actions
jest.mock('@/store/slices/quizSlice', () => ({
  ...jest.requireActual('./quizSlice'),
  fetchQuiz: jest.fn(),
  resetQuizState: jest.fn(),
  setCurrentQuestion: jest.fn(),
  setUserAnswer: jest.fn(),
  markQuizCompleted: jest.fn(),
  setError: jest.fn(),
  clearErrors: jest.fn(),
  submitQuiz: jest.fn(),
  setTempResults: jest.fn(),
  clearTempResults: jest.fn(),
  selectCurrentQuestionData: jest.fn((state) => state.quiz.quizData.questions[state.quiz.currentQuestion]),
  selectQuizProgress: jest.fn((state) => 50),
  selectIsLastQuestion: jest.fn((state) => state.quiz.currentQuestion === state.quiz.quizData.questions.length - 1),
}));

describe('useQuiz Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct quiz state and actions', () => {
    const { result } = renderHook(() => useQuiz());

    expect(result.current.quiz).toEqual({
      data: expect.objectContaining({
        id: 'test-quiz',
        title: 'Test Quiz',
      }),
      currentQuestion: 0,
      currentQuestionData: { id: 'q1', question: 'Question 1' },
      userAnswers: [],
      isLastQuestion: false,
      progress: 50,
      instance: expect.any(Object),
    });

    expect(result.current.status).toEqual({
      isLoading: false,
      isSubmitting: false,
      isCompleted: false,
      hasError: false,
      errorMessage: null,
    });

    expect(result.current.results).toBeNull();
    expect(result.current.tempResults).toBeNull();

    // Check that all actions are functions
    expect(typeof result.current.actions.loadQuiz).toBe('function');
    expect(typeof result.current.actions.submitQuiz).toBe('function');
    expect(typeof result.current.actions.saveAnswer).toBe('function');
    expect(typeof result.current.actions.setTempResults).toBe('function');
    expect(typeof result.current.actions.clearTempResults).toBe('function');
    expect(typeof result.current.actions.reset).toBe('function');

    // Check that all navigation functions are functions
    expect(typeof result.current.navigation.next).toBe('function');
    expect(typeof result.current.navigation.previous).toBe('function');
    expect(typeof result.current.navigation.toQuestion).toBe('function');
  });

  it('should call loadQuiz with correct parameters', async () => {
    const mockDispatch = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({ id: 'test-quiz' }),
    }));
    
    require('@/store').useAppDispatch.mockReturnValue(mockDispatch);
    quizSlice.fetchQuiz.mockReturnValue({ type: 'quiz/fetchQuiz' });
    
    const { result } = renderHook(() => useQuiz());
    
    await act(async () => {
      await result.current.actions.loadQuiz('test-quiz', 'mcq');
    });
    
    expect(quizSlice.clearErrors).toHaveBeenCalled();
    expect(quizSlice.fetchQuiz).toHaveBeenCalledWith({ slug: 'test-quiz', type: 'mcq' });
  });

  it('should handle loadQuiz with initial data', async () => {
    const mockDispatch = jest.fn();
    require('@/store').useAppDispatch.mockReturnValue(mockDispatch);
    
    const { result } = renderHook(() => useQuiz());
    
    const initialData = {
      id: 'test-quiz',
      title: 'Test Quiz',
      slug: 'test-quiz',
      type: 'mcq',
      questions: [{ id: 'q1', question: 'Question 1' }],
      isPublic: true,
      isFavorite: false,
      ownerId: 'owner1',
      timeLimit: 10,
    };
    
    await act(async () => {
      await result.current.actions.loadQuiz('test-quiz', 'mcq', initialData);
    });
    
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: expect.stringContaining('fulfilled'),
      payload: initialData,
    }));
  });

  it('should handle loadQuiz error and redirect to sign-in if unauthorized', async () => {
    const mockDispatch = jest.fn(() => ({
      unwrap: jest.fn().mockRejectedValue('Unauthorized'),
    }));
    
    require('@/store').useAppDispatch.mockReturnValue(mockDispatch);
    
    const { result } = renderHook(() => useQuiz());
    
    await act(async () => {
      try {
        await result.current.actions.loadQuiz('test-quiz', 'mcq');
      } catch (error) {
        // Expected error
      }
    });
    
    expect(signIn).toHaveBeenCalledWith(undefined, {
      callbackUrl: '/dashboard/mcq/test-quiz',
    });
  });

  it('should call submitQuiz with correct parameters', async () => {
    const mockResult = { score: 10 };
    const mockDispatch = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue(mockResult),
    }));
    
    require('@/store').useAppDispatch.mockReturnValue(mockDispatch);
    quizSlice.submitQuiz.mockReturnValue({ type: 'quiz/submitQuiz' });
    quizSlice.markQuizCompleted.mockReturnValue({ type: 'quiz/markQuizCompleted' });
    
    const { result } = renderHook(() => useQuiz());
    
    const payload = {
      slug: 'test-quiz',
      type: 'mcq',
      answers: [{ questionId: 'q1', answer: 'A', isCorrect: true }],
    };
    
    await act(async () => {
      const res = await result.current.actions.submitQuiz(payload);
      expect(res).toEqual(mockResult);
    });
    
    expect(quizSlice.submitQuiz).toHaveBeenCalledWith(payload);
    expect(quizSlice.markQuizCompleted).toHaveBeenCalledWith(mockResult);
  });

  it('should call saveAnswer with correct parameters', () => {
    const mockDispatch = jest.fn();
    require('@/store').useAppDispatch.mockReturnValue(mockDispatch);
    quizSlice.setUserAnswer.mockReturnValue({ type: 'quiz/setUserAnswer' });
    
    const { result } = renderHook(() => useQuiz());
    
    act(() => {
      result.current.actions.saveAnswer('q1', 'A');
    });
    
    expect(quizSlice.setUserAnswer).toHaveBeenCalledWith({
      questionId: 'q1',
      answer: 'A',
    });
  });

  it('should call navigation functions correctly', () => {
    const mockDispatch = jest.fn();
    require('@/store').useAppDispatch.mockReturnValue(mockDispatch);
    quizSlice.setCurrentQuestion.mockReturnValue({ type: 'quiz/setCurrentQuestion' });
    
    // Mock the state for navigation tests
    require('@/store').useAppSelector.mockImplementation((selector) => selector({
      quiz: {
        quizData: {
          questions: [
            { id: 'q1', question: 'Question 1' },
            { id: 'q2', question: 'Question 2' },
            { id: 'q3', question: 'Question 3' },
          ],
        },
        currentQuestion: 1, // Start at the middle question
        userAnswers: [],
        isLoading: false,
        isSubmitting: false,
        isCompleted: false,
        timerActive: false,
        results: null,
        tempResults: null,
        errors: {
          quiz: null,
          submission: null,
          results: null,
          history: null,
        },
        currentQuizType: 'mcq',
        currentQuizSlug: 'test-quiz',
      }
    }));
    
    const { result } = renderHook(() => useQuiz());
    
    // Test next
    act(() => {
      const success = result.current.navigation.next();
      expect(success).toBe(true);
    });
    expect(quizSlice.setCurrentQuestion).toHaveBeenCalledWith(2);
    
    // Test previous
    quizSlice.setCurrentQuestion.mockClear();
    act(() => {
      const success = result.current.navigation.previous();
      expect(success).toBe(true);
    });
    expect(quizSlice.setCurrentQuestion).toHaveBeenCalledWith(0);
    
    // Test toQuestion
    quizSlice.setCurrentQuestion.mockClear();
    act(() => {
      const success = result.current.navigation.toQuestion(2);
      expect(success).toBe(true);
    });
    expect(quizSlice.setCurrentQuestion).toHaveBeenCalledWith(2);
    
    // Test invalid navigation
    quizSlice.setCurrentQuestion.mockClear();
    act(() => {
      const success = result.current.navigation.toQuestion(5); // Out of bounds
      expect(success).toBe(false);
    });
    expect(quizSlice.setCurrentQuestion).not.toHaveBeenCalled();
  });
});
