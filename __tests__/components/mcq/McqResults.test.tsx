import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'; // Fixed import
import ResultsPage from '@/app/dashboard/(quiz)/mcq/[slug]/results/page';
import * as authHooks from '@/hooks/useAuth';
import * as quizHooks from '@/hooks/useQuizState';
import { mockQuizData } from '../../mocks/quiz-mock-data';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

// Mock useQuiz hook
jest.mock('@/hooks/useQuizState', () => ({
  __esModule: true,
  useQuiz: jest.fn(),
}));

// Mock next/navigation
const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

// Create a minimal store for testing
const createTestStore = () => configureStore({
  reducer: {
    quiz: (state = {}, action) => state,
    auth: (state = {}, action) => state
  }
});

// Reduce noise from console errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  pushMock.mockReset();
});

describe('MCQ Quiz Results Page', () => {
  let store;
  // Provide params directly as an object for tests
  const mockParams = { slug: 'test-slug' };

  beforeEach(() => {
    store = createTestStore();
  });

  test('should show sign in prompt when user is not authenticated', async () => {
    // Mock useAuth to return unauthenticated status
    const requireAuthMock = jest.fn();
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      status: 'unauthenticated',
      requireAuth: requireAuthMock,
    });
    
    // Mock useQuiz hook
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage: null },
      actions: {
        getResults: jest.fn(),
      },
    });

    render(
      <Provider store={store}>
        <ResultsPage params={mockParams} />
      </Provider>
    );

    // Verify non-auth prompt is shown
    expect(screen.getByText(/please sign in to view your quiz results/i)).toBeInTheDocument();
    
    // Find and click the sign-in button
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    signInButton.click();
    
    // Verify the requireAuth function was called with correct path
    expect(requireAuthMock).toHaveBeenCalledWith('/dashboard/mcq/test-slug/results');
  });

  test('should show loading state while authentication is pending', () => {
    // Mock useAuth to return loading state
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      status: 'loading',
    });
    
    // Mock useQuiz hook
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage: null },
      actions: {
        getResults: jest.fn(),
      },
    });

    render(
      <Provider store={store}>
        <ResultsPage params={mockParams} />
      </Provider>
    );

    // Check loading state is displayed
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should show loading state while quiz results are loading', () => {
    // Mock useAuth to return authenticated
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
    });
    
    // Mock useQuiz hook - with loading state
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { 
        isLoading: true, 
        errorMessage: null 
      },
      actions: {
        getResults: jest.fn(),
      },
    });

    render(
      <Provider store={store}>
        <ResultsPage params={mockParams} />
      </Provider>
    );

    // Check loading state is displayed
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should show error state when results fetch fails', () => {
    // Mock useAuth to return authenticated
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
    });
    
    // Mock useQuiz hook with error
    const getResultsMock = jest.fn();
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { 
        isLoading: false, 
        errorMessage: "Failed to load quiz results" 
      },
      actions: {
        getResults: getResultsMock,
      },
    });

    render(
      <Provider store={store}>
        <ResultsPage params={mockParams} />
      </Provider>
    );

    // Check error message is displayed
    expect(screen.getByText(/failed to load quiz results/i)).toBeInTheDocument();
    
    // Test retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    retryButton.click();
    
    expect(getResultsMock).toHaveBeenCalledWith('test-slug');
  });

  test('should show "No Results Found" when authenticated but no results available', () => {
    // Mock useAuth to return authenticated
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
    });
    
    // Mock useQuiz hook with no results
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { 
        isLoading: false, 
        errorMessage: null 
      },
      actions: {
        getResults: jest.fn(),
      },
    });

    render(
      <Provider store={store}>
        <ResultsPage params={mockParams} />
      </Provider>
    );

    // Check "no results" message is displayed
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    
    // Check take quiz button directs to proper MCQ path
    const takeQuizButton = screen.getByRole('button', { name: /take the quiz/i });
    takeQuizButton.click();
    
    expect(pushMock).toHaveBeenCalledWith('/dashboard/mcq/test-slug');
  });

  test('should display quiz results when authenticated and results are available', () => {
    // Mock useAuth to return authenticated
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
    });
    
    // Mock quiz results
    const mockResults = {
      quizId: 'quiz-123',
      slug: 'test-slug',
      title: 'Test MCQ Quiz',
      score: 7,
      maxScore: 10,
      percentage: 70,
      completedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          question: 'What is React?',
          userAnswer: 'A library',
          correctAnswer: 'A library',
          isCorrect: true
        },
        {
          id: 'q2',
          question: 'What is TypeScript?',
          userAnswer: 'A programming language',
          correctAnswer: 'A programming language',
          isCorrect: true
        }
      ]
    };
    
    // Mock useQuiz hook with results
    (quizHooks.useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: mockQuizData },
      results: mockResults,
      status: { 
        isLoading: false, 
        errorMessage: null 
      },
      actions: {
        getResults: jest.fn(),
      },
    });

    render(
      <Provider store={store}>
        <ResultsPage params={mockParams} />
      </Provider>
    );

    // Check results are displayed
    expect(screen.getByTestId('mcq-quiz-result')).toBeInTheDocument();
    expect(screen.getByText(/test mcq quiz/i)).toBeInTheDocument();
    expect(screen.getByTestId('score-percentage')).toHaveTextContent('70% Score');
  });

});
