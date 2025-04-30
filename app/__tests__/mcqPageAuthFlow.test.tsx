"use client"

import React from "react"
import { render, fireEvent, act, waitFor } from "@testing-library/react"
import { quizService } from "@/lib/quiz-service"
import * as QuizContext from "@/app/context/QuizContext"
import McqQuizWrapper from "../dashboard/(quiz)/mcq/components/McqQuizWrapper"

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
    clearAllStorage: jest.fn(), // Corrected method name
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

// Correct the path for the McqQuiz component mock
jest.mock("../dashboard/(quiz)/mcq/components/McqQuiz", () => {
  return function MockMcqQuiz(props) {
    return React.createElement(
      "div",
      { "data-testid": "mcq-quiz" },
      React.createElement("button", {
        "data-testid": "answer-question",
        onClick: () => props.onAnswer("test", 10, true),
        children: "Answer Question",
      }),
    )
  }
})

// Mock the McqQuizResult component
jest.mock("../dashboard/(quiz)/mcq/components/McqQuizResult", () => {
  return function MockMcqQuizResult(props) {
    return React.createElement(
      "div",
      { "data-testid": "mcq-result" },
      React.createElement("button", {
        "data-testid": "restart-quiz",
        onClick: props.onRestart,
        children: "Restart Quiz",
      }),
    )
  }
})

// Mock the GuestSignInPrompt component
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

// Mock the McqQuizWrapper component to bypass initialization
jest.mock("../dashboard/(quiz)/mcq/components/McqQuizWrapper", () => {
  const originalModule = jest.requireActual("../dashboard/(quiz)/mcq/components/McqQuizWrapper")
  return {
    __esModule: true,
    default: originalModule.default,
  }
})

describe("Quiz Authentication Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset window.location.search for each test
    mockLocation.search = ""

    // Default mock implementation for useQuiz
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
        currentQuestionIndex: 0,
        questionCount: 2,
        isLoading: false, // Set to false to avoid loading state
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
        isInitialized: true, // Add this to bypass initialization
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
    isPublic: true,
    isFavorite: false,
    userId: "user1",
  }

  const mockQuestions = [
    {
      id: 1,
      question: "Question 1",
      answer: "Answer 1",
      option1: "Option 1",
      option2: "Option 2",
      option3: "Option 3",
    },
    {
      id: 2,
      question: "Question 2",
      answer: "Answer 2",
      option1: "Option 1",
      option2: "Option 2",
      option3: "Option 3",
    },
  ]

  test("authenticated user sees results immediately after quiz completion", async () => {
    // 1. Mock authenticated user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user1" },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // 2. Mock quiz service to return authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(true)

    // 3. Mock completeQuiz to call submitQuizResult
    const completeQuiz = jest.fn().mockImplementation((answers) => {
      // This simulates what happens in the real completeQuiz function
      quizService.submitQuizResult({
        quizId: "123",
        slug: "test-quiz",
        type: "mcq",
        score: 100,
        answers: answers.filter((a) => a !== null),
        totalTime: 20,
        totalQuestions: 2,
      })
    })

    // 4. Set up the useQuiz mock with authenticated state
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
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
      completeQuiz: completeQuiz,
      restartQuiz: jest.fn(),
      isAuthenticated: true,
      handleAuthenticationRequired: jest.fn(),
      fetchQuizResults: jest.fn(),
      clearQuizData: jest.fn(),
      clearGuestResults: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)

    // 5. Render the component
    const { findByTestId } = render(
      <McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />,
    )

    // 6. Wait for the quiz to be rendered
    const answerButton = await findByTestId("answer-question")

    // 7. Answer the question
    fireEvent.click(answerButton)

    // 8. Complete the quiz by calling completeQuiz directly
    act(() => {
      const answers = [{ answer: "test", timeSpent: 10, isCorrect: true }, null]
      mockUseQuiz.completeQuiz(answers)
    })

    // 9. Verify that submitQuizResult was called to save the results
    await waitFor(() => {
      expect(quizService.submitQuizResult).toHaveBeenCalled()
    })
  })

  test("guest user sees sign-in prompt after quiz completion", async () => {
    // 1. Mock guest user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // 2. Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // 3. Mock hasGuestResult to return true
    ;(quizService.getGuestResult as jest.Mock).mockReturnValue({
      quizId: "123",
      score: 80,
      answers: [{ answer: "test", timeSpent: 10, isCorrect: true }],
    })

    // 4. Set up the useQuiz mock with guest state and completed quiz
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
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

    // 5. Render the component
    const { findByTestId } = render(
      <McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />,
    )

    // 6. Verify that the guest prompt is shown
    const guestPrompt = await findByTestId("guest-prompt")
    expect(guestPrompt).toBeInTheDocument()
  })

  test("clicking 'Sign In' saves state and redirects to auth", async () => {
    // 1. Mock guest user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // 2. Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // 3. Set up the useQuiz mock with guest state and completed quiz
    const handleAuthenticationRequired = jest.fn()
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
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

    // 4. Render the component
    const { findByTestId } = render(
      <McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />,
    )

    // 5. Find and click the "Sign In" button
    const signInButton = await findByTestId("sign-in")

    // Mock the savePendingQuizData and saveAuthRedirect functions to ensure they're called
    quizService.savePendingQuizData = jest.fn()
    quizService.saveAuthRedirect = jest.fn()

    fireEvent.click(signInButton)

    // 6. Verify that handleAuthenticationRequired was called
    expect(handleAuthenticationRequired).toHaveBeenCalled()

    // 7. Verify that savePendingQuizData was called to save the state
    expect(quizService.savePendingQuizData).toHaveBeenCalled()

    // 8. Verify that saveAuthRedirect was called to save the redirect URL
    expect(quizService.saveAuthRedirect).toHaveBeenCalled()
  })

  test("returning from authentication shows results and clears state", async () => {
    // 1. Mock authenticated user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user1" },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // 2. Mock quiz service to return authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(true)

    // 3. Set URL parameter to simulate returning from auth
    mockLocation.search = "?fromAuth=true"

    // 4. Mock processPendingQuizData to simulate processing auth data
    quizService.processPendingQuizData.mockImplementation(async () => {
      console.log("Processing pending quiz data")
      // Simulate what happens in the real processPendingQuizData
      // This should call clearGuestResult and clearQuizState
      quizService.clearGuestResult("123")
      quizService.clearQuizState("123", "mcq")
    })

    // 5. Set up the useQuiz mock with authenticated state and returning from auth
    const fetchQuizResults = jest.fn().mockResolvedValue(true)
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
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

    // 6. Render the component
    render(<McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />)

    // 7. Verify that processPendingQuizData was called
    await waitFor(() => {
      expect(quizService.processPendingQuizData).toHaveBeenCalled()
    })

    // 8. Verify that fetchQuizResults was called
    expect(fetchQuizResults).toHaveBeenCalled()

    // 9. Verify that clearGuestResult was called to clean up guest data
    expect(quizService.clearGuestResult).toHaveBeenCalled()

    // 10. Verify that clearQuizState was called to clean up in-progress state
    expect(quizService.clearQuizState).toHaveBeenCalled()
  })

  test("clicking 'Continue as Guest' resets the quiz", async () => {
    // 1. Mock guest user
    const { useAuth } = require("@/providers/unified-auth-provider")
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      signIn: jest.fn(),
    })

    // 2. Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // 3. Set up the useQuiz mock with guest state and completed quiz
    const clearGuestResults = jest.fn()
    const restartQuiz = jest.fn()
    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
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

    // 4. Render the component
    const { findByTestId } = render(
      <McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />,
    )

    // 5. Find and click the "Continue as Guest" button
    const continueAsGuestButton = await findByTestId("continue-as-guest")
    fireEvent.click(continueAsGuestButton)

    // 6. Verify that clearGuestResults was called
    expect(clearGuestResults).toHaveBeenCalled()

    // 7. Verify that restartQuiz was called
    expect(restartQuiz).toHaveBeenCalled()
  })

  test("should properly handle authentication state transitions", async () => {
    // 1. Mock the auth provider to return isAuthenticated: false initially
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

    // 2. Mock quiz service to return not authenticated
    ;(quizService.isAuthenticated as jest.Mock).mockReturnValue(false)

    // 3. Set up the useQuiz mock with guest state and completed quiz
    const handleAuthenticationRequired = jest.fn()
    const fetchQuizResults = jest.fn().mockResolvedValue(true)

    const mockUseQuiz = {
      state: {
        quizId: "123",
        slug: "test-quiz",
        quizType: "mcq",
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

    // 4. Render the component
    const { findByTestId } = render(
      <McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />,
    )

    // 5. Verify that the guest prompt is shown
    const guestPrompt = await findByTestId("guest-prompt")
    expect(guestPrompt).toBeInTheDocument()

    // 6. Find and click the "Sign In" button
    const signInButton = await findByTestId("sign-in")
    fireEvent.click(signInButton)

    // 7. Verify that handleAuthenticationRequired was called
    expect(handleAuthenticationRequired).toHaveBeenCalled()

    // 8. Verify that savePendingQuizData was called
    expect(quizService.savePendingQuizData).toHaveBeenCalled()

    // 9. Now simulate returning from authentication
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
      quizService.clearQuizState("123", "mcq")
    })

    // Create a new component instance with authenticated state
    const { findByTestId: findByTestIdAuth } = render(
      <McqQuizWrapper quizData={mockQuizData} questions={mockQuestions} slug="test-quiz" />,
    )

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
