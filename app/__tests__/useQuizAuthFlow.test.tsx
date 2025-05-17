"use client"

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useQuiz } from '@/hooks/useQuizState';
import { signIn } from 'next-auth/react';
import { waitFor } from '@testing-library/react';
import { createReducer } from '@reduxjs/toolkit';
import fetchMock from "jest-fetch-mock"
import quizReducer from "@/store/slices/quizSlice"

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
  // Enable fetch mocks
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  test("should redirect to sign-in on authentication error", async () => {
    // Mock the signIn function from next-auth
    const signIn = require("next-auth/react").signIn;
    
    // Setup store
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          quizData: null,
          currentQuestion: 0,
          userAnswers: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          results: null,
          isCompleted: false,
          timeRemaining: null,
          timerActive: false,
          submissionError: null,
          quizHistory: [],
          submissionStateInProgress: false,
          quizError: null,
          resultsError: null,
          historyError: null,
          currentQuizId: null,
        },
      },
    });
    
    // Setup wrapper for testing hooks with Redux
    const wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
    
    // Setup fetch mock to return a 401 unauthorized response
    fetchMock.mockResponseOnce(JSON.stringify({ message: "Unauthorized" }), { 
      status: 401,
      statusText: "Unauthorized"
    });
    
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
    expect(signIn).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        callbackUrl: expect.stringContaining("/dashboard/code/protected-quiz")
      })
    );
  });

  test("should redirect to sign-in on auth error during submission", async () => {
    // Mock the signIn function
    const signIn = require("next-auth/react").signIn;
    
    // Setup store with some quiz data already loaded
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
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
          results: null,
          isCompleted: false,
          timeRemaining: null,
          timerActive: false,
          submissionError: null,
          quizHistory: [],
          submissionStateInProgress: false,
          quizError: null,
          resultsError: null,
          historyError: null,
          currentQuizId: "test-quiz",
        },
      },
    });
    
    // Setup wrapper for Redux provider
    const wrapper = ({ children }) => (
      <Provider store={store}>
        {children}
      </Provider>
    );
    
    const { result } = renderHook(() => useQuiz(), { wrapper });
    
    // Mock fetch to return a 401 on submission
    fetchMock.mockResponseOnce(JSON.stringify({ message: "Session expired" }), {
      status: 401,
      statusText: "Unauthorized"
    });
    
    // Try to submit the quiz
    await act(async () => {
      try {
        await result.current.submitQuiz({
          slug: "test-quiz",
          type: "code",
          answers: [{ questionId: "q1", answer: "test answer" }]
        });
      } catch (error) {
        // Expected error
      }
    });
    
    // Check if signIn was called correctly
    expect(signIn).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        callbackUrl: expect.stringContaining("/dashboard/code/test-quiz")
      })
    );
  });
});
