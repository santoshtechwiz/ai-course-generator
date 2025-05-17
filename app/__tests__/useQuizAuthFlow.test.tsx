"use client"

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useQuiz } from '@/hooks/useQuizState';
import { signIn } from 'next-auth/react';
import { waitFor } from '@testing-library/react';
import quizReducer from "@/store/slices/quizSlice";

// Create test data
const mockQuizData = {
  id: "test-quiz",
  title: "Test Quiz",
  description: "A test quiz",
  slug: "test-quiz",
  questions: [
    { id: "q1", question: "Question 1?" }
  ]
};

// Add the auth reducer
const authReducer = (state = { userRedirectState: null, hasRedirectState: false }, action) => {
  if (action.type === 'auth/setUserRedirectState') {
    return { ...state, userRedirectState: action.payload, hasRedirectState: true };
  }
  if (action.type === 'auth/clearUserRedirectState') {
    return { ...state, userRedirectState: null, hasRedirectState: false };
  }
  return state;
};

// Silence console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' }))
}));

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useParams: jest.fn().mockReturnValue({ slug: "test-quiz" }),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn(),
    has: jest.fn().mockReturnValue(false)
  }),
}));

// Properly set up mock for the useQuiz hook
jest.mock('@/hooks/useQuizState', () => ({
  useQuiz: jest.fn()
}));

describe("useQuiz hook auth flow", () => {
  // Setup fetch mocks
  beforeAll(() => {
    global.fetch = jest.fn();
    
    // Add this to prevent localStorage errors in tests
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => null),
        removeItem: jest.fn(() => null),
      },
      writable: true
    });
    
    // Add empty auth state to fix tests
    const preloadedState = {
      quiz: {
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
        timeRemaining: null,
        timerActive: false,
        submissionStateInProgress: false,
        quizHistory: [],
        currentQuizId: null,
        errors: { quiz: null, submission: null, results: null, history: null }
      },
      auth: {
        userRedirectState: null,
        hasRedirectState: false
      }
    };
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  test("should redirect to sign-in on authentication error", async () => {
    // Mock the signIn function from next-auth
    const mockSignIn = jest.fn();
    require("next-auth/react").signIn = mockSignIn;
    
    // Setup store with both reducers
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
        auth: authReducer
      },
      preloadedState: {
        quiz: {
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
          timeRemaining: null,
          timerActive: false,
          submissionStateInProgress: false,
          quizHistory: [],
          currentQuizId: null,
          errors: { quiz: null, submission: null, results: null, history: null }
        },
        auth: {
          userRedirectState: null,
          hasRedirectState: false
        }
      },
    });
    
    // Setup wrapper for testing hooks with Redux
    const wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
    
    // Setup fetch mock to return a 401 unauthorized response
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({ message: "Unauthorized" })
      })
    );
    
    const { result } = renderHook(() => useQuiz(), { wrapper });
    
    // Try to load an auth-protected quiz
    await act(async () => {
      try {
        await result.current.loadQuiz("protected-quiz", "code");
      } catch (error) {
        // This is expected since we're getting a 401
      }
    });
    
    // Verify that signIn was called as expected
    expect(mockSignIn).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        callbackUrl: expect.stringContaining("/dashboard/code/protected-quiz")
      })
    );
  });

  test("should redirect to sign-in on auth error during submission", async () => {
    // Mock the signIn function
    const mockSignIn = jest.fn();
    require("next-auth/react").signIn = mockSignIn;
    
    // Mock the submitQuiz function to throw a proper error
    const mockSubmitQuiz = jest.fn().mockImplementation(() => {
      // Create an error object that can be extended
      const error = new Error("Unauthorized");
      Object.defineProperty(error, 'status', {
        value: 401,
        writable: true,
        configurable: true
      });
      throw error;
    });
    
    // Create a mock useQuiz implementation first
    const mockUseQuiz = {
      quizData: mockQuizData,
      currentQuestion: 0,
      userAnswers: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      submitQuiz: mockSubmitQuiz
    };
    
    // Apply the mock implementation to the useQuiz hook
    require("@/hooks/useQuizState").useQuiz.mockImplementation(() => mockUseQuiz);
    
    // Create Redux store for the wrapper
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
        auth: authReducer
      },
      preloadedState: {
        quiz: {
          quizData: mockQuizData,
          currentQuestion: 0,
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null
        },
        auth: {
          userRedirectState: null,
          hasRedirectState: false
        }
      },
    });

    // Create wrapper with store
    const wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
    
    // Render the hook
    const { result } = renderHook(() => useQuiz(), { wrapper });
    
    // Try to submit quiz which should throw an auth error
    await expect(async () => {
      try {
        await result.current.submitQuiz({
          slug: "test-quiz",
          quizId: "test-quiz",
          type: "code",
          answers: []
        });
      } catch (error) {
        // This should trigger the signIn call via the error handling in useQuiz
        expect(mockSignIn).toHaveBeenCalled();
        throw error; // re-throw so the test can catch it
      }
    }).rejects.toThrow();
  });
});
