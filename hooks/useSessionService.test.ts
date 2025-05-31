import { renderHook, act } from '@testing-library/react-hooks';
import { useSessionService } from './useSessionService';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Mock Redux dispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

// Mock Next.js router
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock NextAuth useSession
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

describe('useSessionService', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockRouterPush.mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should save auth redirect state to session storage', () => {
    const { result } = renderHook(() => useSessionService());
    const saveAuthRedirectState = result.current.saveAuthRedirectState;

    const state = {
      returnPath: '/dashboard/blanks/test-quiz/results?fromAuth=true',
      quizState: {
        slug: 'test-quiz',
        quizData: {
          title: 'Test Quiz',
          questions: [],
        },
        currentState: {
          answers: {},
          isCompleted: true,
          showResults: true,
          results: { score: 100 },
        },
      },
    };

    act(() => {
      saveAuthRedirectState(state);
    });

    expect(sessionStorage.getItem('auth_redirect_state')).toEqual(JSON.stringify(state));
  });

  it('should restore auth redirect state from session storage and dispatch actions', async () => {
    const { result } = renderHook(() => useSessionService());
    const saveAuthRedirectState = result.current.saveAuthRedirectState;
    const restoreAuthRedirectState = result.current.restoreAuthRedirectState;

    const state = {
      returnPath: '/dashboard/blanks/test-quiz/results?fromAuth=true',
      quizState: {
        slug: 'test-quiz',
        quizData: {
          title: 'Test Quiz',
          questions: [{ id: 1, text: 'Question 1' }],
        },
        currentState: {
          answers: { 1: 'Answer 1' },
          isCompleted: true,
          showResults: true,
          results: { score: 100 },
        },
      },
    };

    act(() => {
      saveAuthRedirectState(state);
    });

    expect(sessionStorage.getItem('auth_redirect_state')).toEqual(JSON.stringify(state));

    await act(async () => {
      await restoreAuthRedirectState();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(6);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setQuizTitle', payload: 'Test Quiz' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setQuestions', payload: [{ id: 1, text: 'Question 1' }] });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setAnswers', payload: { 1: 'Answer 1' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setIsCompleted', payload: true });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setShowResults', payload: true });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setQuizResults', payload: { score: 100 } });
    expect(sessionStorage.getItem('auth_redirect_state')).toBeNull();
    expect(sessionStorage.getItem('test-quiz_auth_for_results')).toEqual('true');
  });

  it('should clear quiz results by dispatching reset actions', () => {
    const { result } = renderHook(() => useSessionService());
    const clearQuizResults = result.current.clearQuizResults;

    act(() => {
      clearQuizResults();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(6);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setQuizTitle', payload: null });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setQuestions', payload: [] });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setAnswers', payload: {} });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setIsCompleted', payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setShowResults', payload: false });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'quiz/setQuizResults', payload: null });
  });

  it('should store results in local storage', () => {
    const { result } = renderHook(() => useSessionService());
    const storeResults = result.current.storeResults;

    const slug = 'test-quiz';
    const results = { score: 100 };

    act(() => {
      storeResults(slug, results);
    });

    expect(localStorage.getItem('test-quiz_quiz_results')).toEqual(JSON.stringify(results));
  });

  it('should get stored results from local storage', () => {
    const { result } = renderHook(() => useSessionService());
    const getStoredResults = result.current.getStoredResults;

    const slug = 'test-quiz';
    const results = { score: 100 };

    localStorage.setItem('test-quiz_quiz_results', JSON.stringify(results));

    const storedResults = getStoredResults(slug);

    expect(storedResults).toEqual(results);
  });

  it('should return null if no stored results are found', () => {
    const { result } = renderHook(() => useSessionService());
    const getStoredResults = result.current.getStoredResults;

    const slug = 'nonexistent-quiz';

    const storedResults = getStoredResults(slug);

    expect(storedResults).toBeNull();
  });
});
