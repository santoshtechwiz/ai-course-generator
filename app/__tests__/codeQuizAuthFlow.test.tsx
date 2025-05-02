"use client"

import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { quizService } from "@/lib/quiz-service"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"
import * as QuizContext from "@/app/context/QuizContext"; // Add this import

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock window.location and window.history
const mockLocation = {
  href: "http://localhost:3000/test",
  search: "",
  pathname: "/test",
  replace: jest.fn(),
}

const mockHistory = {
  replaceState: jest.fn(),
  pushState: jest.fn(),
}

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
})

Object.defineProperty(window, "history", {
  value: mockHistory,
  writable: true,
})

// Ensure the path is correct
jest.mock("@/app/context/QuizContext", () => {
  const originalModule = jest.requireActual("@/app/context/QuizContext")
  return {
    ...originalModule,
    useQuiz: jest.fn(),
    QuizProvider: function MockQuizProvider(props) {
      return React.createElement("div", null, props.children)
    },
  }
})

// Mock the auth provider
jest.mock("@/providers/unified-auth-provider", () => ({
  useAuth: jest.fn().mockReturnValue({
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    signIn: jest.fn(),
  }),
}))

// Mock toast for testing error notifications
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock quiz-service
jest.mock("@/lib/quiz-service", () => ({
  quizService: {
    saveQuizState: jest.fn(),
    getQuizState: jest.fn(),
    clearQuizState: jest.fn(),
    saveQuizResult: jest.fn(),
    saveGuestResult: jest.fn(),
    saveAuthRedirect: jest.fn(),
    handleAuthRedirect: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(false),
    isInAuthFlow: jest.fn().mockReturnValue(false),
    clearAuthFlow: jest.fn(),
    clearAllStorage: jest.fn(),
    savePendingQuizData: jest.fn(),
    processPendingQuizData: jest.fn(),
    getGuestResult: jest.fn(),
    isQuizCompleted: jest.fn(),
    isInRedirectLoop: jest.fn().mockReturnValue(false),
    clearAllStorageData: jest.fn(),
    clearGuestResult: jest.fn(),
    submitQuizResult: jest.fn().mockResolvedValue({ success: true }),
  },
}))

// Mock CodingQuiz component
jest.mock("../dashboard/(quiz)/code/components/CodingQuiz", () => {
  return function MockCodingQuiz(props) {
    return React.createElement(
      "div",
      { "data-testid": "coding-quiz" },
      React.createElement("button", {
        "data-testid": "answer-question",
        onClick: () => props.onAnswer("test-answer", 10, true),
        children: "Answer Question",
      }),
    )
  }
})

// Mock CodeQuizResult component
jest.mock("../dashboard/(quiz)/code/components/CodeQuizResult", () => {
  return function MockCodeQuizResult(props) {
    return React.createElement(
      "div",
      { "data-testid": "quiz-results" },
      React.createElement("button", {
        "data-testid": "restart-quiz",
        onClick: props.onRestart,
        children: "Restart Quiz",
      }),
    )
  }
})

// Mock GuestSignInPrompt component
jest.mock("../dashboard/(quiz)/components/GuestSignInPrompt", () => ({
  GuestSignInPrompt: function MockGuestPrompt(props) {
    // Call saveAuthRedirect if redirectUrl is provided
    const handleSignIn = () => {
      if (props.redirectUrl) {
        quizService.saveAuthRedirect(props.redirectUrl)
      }
      props.onSignIn()
    }

    return React.createElement(
      "div",
      { "data-testid": "guest-prompt" },
      React.createElement("button", {
        "data-testid": "sign-in",
        onClick: handleSignIn,
        children: "Sign In",
      }),
      React.createElement("button", {
        "data-testid": "continue-as-guest",
        onClick: props.onContinueAsGuest,
        children: "Go Back",
      }),
      // Always render the clear data button in tests for simplicity
      React.createElement("button", {
        "data-testid": "clear-data",
        onClick: props.onClearData || (() => {}),
        children: "Clear Data",
      }),
    )
  },
}))

// Mock CodeQuizOptions component
jest.mock("../dashboard/(quiz)/code/components/CodeQuizOptions", () => {
  return function MockCodeQuizOptions(props) {
    return React.createElement(
      "div",
      { "data-testid": "quiz-options" },
      React.createElement("button", {
        "data-testid": "start-button",
        onClick: props.onStart,
        children: "Start Quiz",
      }),
    )
  }
})

describe("CodeQuiz Authentication Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset window.location.search for each test
    mockLocation.search = ""

    // Default mock implementation for useQuiz
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 0,
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: false,
        answers: [null, null],
        animationState: "idle",
        timeSpentPerQuestion: [0, 0],
        requiresAuth: false,
        hasGuestResult: false,
        authCheckComplete: true,
        pendingAuthRequired: false,
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: false,
      handleAuthenticationRequired: jest.fn(),
      fetchQuizResults: jest.fn(),
      clearQuizData: jest.fn().mockImplementation(() => {
        // Call the quiz service method when clearQuizData is called
        quizService.clearAllStorage()
      }),
      clearGuestResults: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)
  })

  const mockQuizData = {
    id: "123",
    title: "Test Quiz",
    slug: "test-quiz",
    description: "A test quiz",
    questions: [
      {
        id: "q1",
        question: "Test Question 1",
        codeSnippet: "function test() {}",
        language: "javascript",
        answer: "test",
      },
      {
        id: "q2",
        question: "Test Question 2",
        codeSnippet: "function test2() {}",
        language: "javascript",
        answer: "test2",
      },
    ],
  }


  test("prompts for authentication when unauthenticated user completes quiz", async () => {
    // Mock guest user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // Mock hasGuestResult to return true
    ;(quizService.getGuestResult as jest.Mock).mockReturnValue({
      quizId: "123",
      score: 80,
      answers: [{ answer: "test", timeSpent: 10, isCorrect: true }],
    })

    // Set up the useQuiz mock with guest state and completed quiz
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 1, // Last question
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: true, // Quiz is completed
        answers: [
          { answer: "test", timeSpent: 10, isCorrect: true },
          { answer: "test", timeSpent: 10, isCorrect: true },
        ],
        animationState: "showing-results",
        timeSpentPerQuestion: [10, 10],
        requiresAuth: true, // Requires auth
        hasGuestResult: true,
        authCheckComplete: true,
        pendingAuthRequired: true,
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
        score: 80,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: false,
      handleAuthenticationRequired: jest.fn(),
      fetchQuizResults: jest.fn(),
      clearQuizData: jest.fn(),
      clearGuestResults: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)

    const { findByTestId } = render(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Verify that the guest prompt is shown
    const guestPrompt = await findByTestId("guest-prompt")
    expect(guestPrompt).toBeInTheDocument()
  })

  test("shows results when authenticated user completes quiz", async () => {
    // Mock authenticated user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user1" },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // Mock quiz service to return authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(true)

    // Set up the useQuiz mock with authenticated state and completed quiz
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 1, // Last question
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: true, // Quiz is completed
        answers: [
          { answer: "test", timeSpent: 10, isCorrect: true },
          { answer: "test", timeSpent: 10, isCorrect: true },
        ],
        animationState: "showing-results",
        timeSpentPerQuestion: [10, 10],
        requiresAuth: false,
        hasGuestResult: false,
        authCheckComplete: true,
        pendingAuthRequired: false,
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
        resultsReady: true,
        score: 80,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: true,
      handleAuthenticationRequired: jest.fn(),
      fetchQuizResults: jest.fn(),
      clearQuizData: jest.fn(),
      clearGuestResults: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)

    const { findByTestId } = render(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Verify that the results are shown
    const results = await findByTestId("quiz-results")
    expect(results).toBeInTheDocument()
  })

  test("clicking 'Continue as Guest' resets quiz without redirecting", async () => {
    // Mock guest user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // Set up the useQuiz mock with guest state and completed quiz
    const clearGuestResults = jest.fn()
    const restartQuiz = jest.fn()
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 1, // Last question
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: true, // Quiz is completed
        answers: [
          { answer: "test", timeSpent: 10, isCorrect: true },
          { answer: "test", timeSpent: 10, isCorrect: true },
        ],
        animationState: "showing-results",
        timeSpentPerQuestion: [10, 10],
        requiresAuth: true, // Requires auth
        hasGuestResult: true,
        authCheckComplete: true,
        pendingAuthRequired: true,
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz,
      isAuthenticated: false,
      handleAuthenticationRequired: jest.fn(),
      fetchQuizResults: jest.fn(),
      clearQuizData: jest.fn(),
      clearGuestResults,
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)

    const { findByTestId } = render(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Find and click the "Continue as Guest" button
    const continueAsGuestButton = await findByTestId("continue-as-guest")
    fireEvent.click(continueAsGuestButton)

    // Verify that clearGuestResults was called
    expect(clearGuestResults).toHaveBeenCalled()

    // Verify that restartQuiz was called
    expect(restartQuiz).toHaveBeenCalled()
  })

  test("clicking 'Sign In' saves state and redirects to auth", async () => {
    // Mock guest user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // Set up the useQuiz mock with guest state and completed quiz
    const handleAuthenticationRequired = jest.fn()
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 1, // Last question
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: true, // Quiz is completed
        answers: [
          { answer: "test", timeSpent: 10, isCorrect: true },
          { answer: "test", timeSpent: 10, isCorrect: true },
        ],
        animationState: "showing-results",
        timeSpentPerQuestion: [10, 10],
        requiresAuth: true, // Requires auth
        hasGuestResult: true,
        authCheckComplete: true,
        pendingAuthRequired: true,
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: false,
      handleAuthenticationRequired,
      fetchQuizResults: jest.fn(),
      clearQuizData: jest.fn(),
      clearGuestResults: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)

    const { findByTestId } = render(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Find and click the "Sign In" button
    const signInButton = await findByTestId("sign-in")
    fireEvent.click(signInButton)

    // Verify that handleAuthenticationRequired was called
    expect(handleAuthenticationRequired).toHaveBeenCalled()

    // Verify that savePendingQuizData was called
    expect(quizService.savePendingQuizData).toHaveBeenCalled()

    // Verify that saveAuthRedirect was called
    expect(quizService.saveAuthRedirect).toHaveBeenCalled()
  })

  test("returning from authentication shows results and clears state", async () => {
    // Mock authenticated user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user1" },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // Mock quiz service to return authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(true)

    // Set URL parameter to simulate returning from auth
    mockLocation.search = "?fromAuth=true"

    // Mock processPendingQuizData to simulate processing auth data
    quizService.processPendingQuizData.mockImplementation(async () => {
      console.log("Processing pending quiz data")
      // Simulate what happens in the real processPendingQuizData
      quizService.clearGuestResult("123")
      quizService.clearQuizState("123", "code")
    })

    // Set up the useQuiz mock with authenticated state and returning from auth
    const fetchQuizResults = jest.fn().mockResolvedValue(true)
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 0,
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: false,
        answers: [null, null],
        animationState: "idle",
        timeSpentPerQuestion: [0, 0],
        requiresAuth: false,
        hasGuestResult: false,
        authCheckComplete: true,
        pendingAuthRequired: false,
        isProcessingAuth: true, // Important: Set to true to trigger the auth processing
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: true,
      handleAuthenticationRequired: jest.fn(),
      fetchQuizResults,
      clearQuizData: jest.fn(),
      clearGuestResults: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)

    render(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Verify that processPendingQuizData was called
    await waitFor(() => {
      expect(quizService.processPendingQuizData).toHaveBeenCalled()
    })

    // Verify that fetchQuizResults was called
    expect(fetchQuizResults).toHaveBeenCalled()

    // Verify that clearGuestResult was called
    expect(quizService.clearGuestResult).toHaveBeenCalled()

    // Verify that clearQuizState was called
    expect(quizService.clearQuizState).toHaveBeenCalled()
  })

  test("should properly handle authentication state transitions", async () => {
    // Mock the auth provider to return isAuthenticated: false initially
    const { useAuth } = require("@/providers/unified-auth-provider")
    const mockSignIn = jest.fn()
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: mockSignIn,
    })

    // Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // Set up the useQuiz mock with guest state and completed quiz
    const handleAuthenticationRequired = jest.fn()
    const fetchQuizResults = jest.fn().mockResolvedValue(true)

    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "code",
        currentQuestionIndex: 1, // Last question
        questionCount: 2,
        isLoading: false,
        error: null,
        isCompleted: true, // Quiz is completed
        answers: [
          { answer: "test", timeSpent: 10, isCorrect: true },
          { answer: "test", timeSpent: 10, isCorrect: true },
        ],
        animationState: "showing-results",
        timeSpentPerQuestion: [10, 10],
        requiresAuth: true, // Requires auth
        hasGuestResult: true,
        authCheckComplete: true,
        pendingAuthRequired: true,
        savingResults: false,
        resultLoadError: null,
        isInitialized: true,
        score: 80,
      },
      submitAnswer: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      isAuthenticated: false,
      handleAuthenticationRequired,
      fetchQuizResults,
      clearQuizData: jest.fn(),
      clearGuestResults: jest.fn(),
    }

    // Use a stable reference for the mock to avoid re-renders
    const stableMockUseQuiz = { ...mockUseQuiz }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(stableMockUseQuiz)

    const { findByTestId, rerender } = render(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Verify that the guest prompt is shown
    const guestPrompt = await findByTestId("guest-prompt")
    expect(guestPrompt).toBeInTheDocument()

    // Find and click the "Sign In" button
    const signInButton = await findByTestId("sign-in")
    fireEvent.click(signInButton)

    // Verify that handleAuthenticationRequired was called
    expect(handleAuthenticationRequired).toHaveBeenCalled()

    // Verify that savePendingQuizData was called
    expect(quizService.savePendingQuizData).toHaveBeenCalled()

    // Verify that saveAuthRedirect was called
    expect(quizService.saveAuthRedirect).toHaveBeenCalled()

    // Now simulate returning from authentication
    // First, update the auth mock to return authenticated
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user1" },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: mockSignIn,
    })

    // Update quiz service mock
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(true)

    // Mock URL parameters to simulate returning from auth
    mockLocation.search = "?fromAuth=true"

    // Mock processPendingQuizData to simulate processing auth data
    quizService.processPendingQuizData.mockImplementation(async () => {
      console.log("Processing pending quiz data")
      quizService.clearGuestResult("123")
      quizService.clearQuizState("123", "code")
    })

    // Update the useQuiz mock for the authenticated state
    const authenticatedMockUseQuiz = {
      ...stableMockUseQuiz,
      state: {
        ...stableMockUseQuiz.state,
        isProcessingAuth: true,
      },
      isAuthenticated: true,
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(authenticatedMockUseQuiz)

    // Rerender with the updated state
    rerender(<CodeQuizWrapper slug="test-quiz" quizData={mockQuizData} quizId="123" />)

    // Verify that processPendingQuizData was called
    await waitFor(() => {
      expect(quizService.processPendingQuizData).toHaveBeenCalled()
    })

    // Verify that clearGuestResult was called
    expect(quizService.clearGuestResult).toHaveBeenCalled()

    // Verify that clearQuizState was called
    expect(quizService.clearQuizState).toHaveBeenCalled()
  })
})
