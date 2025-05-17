"use client"

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useQuiz } from '@/hooks/useQuizState';
import { signIn } from 'next-auth/react';
import { waitFor } from '@testing-library/react';
import quizReducer from "@/store/slices/quizSlice";

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

describe("useQuiz hook auth flow", () => {
  // Setup fetch mocks
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    delete global.fetch;
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
    
    // Setup store with both reducers
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
        auth: authReducer
      },
      preloadedState: {
        quiz: {
          quizData: {
            id: "test-quiz",
            title: "Test Quiz",
            slug: "test-quiz",
            type: "code",
            questions: [
              {
                id: "q1",
                question: "Sample question",
                type: "code"
              }
            ]
          },
          currentQuestion: 0,
          userAnswers: [{ questionId: "q1", answer: "test answer" }],
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
          currentQuizId: "test-quiz",
          errors: { quiz: null, submission: null, results: null, history: null }
        },
        auth: {
          userRedirectState: null,
          hasRedirectState: false
        }
      }
    });
    
    // Setup wrapper for Redux provider
    const wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
    
    const { result } = renderHook(() => useQuiz(), { wrapper });
    
    // Mock fetch to return a 401 on submission
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({ message: "Session expired" })
      })
    );
    
    // Try to submit the quiz - ensure the rejection error has status 401
    await act(async () => {
      try {
        await result.current.submitQuiz({
          slug: "test-quiz",
          type: "code",
          answers: [{ questionId: "q1", answer: "test answer" }]
        });
      } catch (error) {
        // Make sure error has a status property
        error.status = 401;
        throw error;
      }
    });
    
    // Check if signIn was called correctly
    expect(mockSignIn).toHaveBeenCalled();
  });
});
