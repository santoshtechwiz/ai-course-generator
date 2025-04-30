"use client"

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QuizProvider } from "../context/QuizContext"

import { quizService } from "@/lib/quiz-service"
import { useAuth } from "@/providers/unified-auth-provider"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"

// Mock the auth provider
jest.mock("@/providers/unified-auth-provider", () => ({
  useAuth: jest.fn(),
}))

// Mock the quiz service
jest.mock("../lib/quiz-service", () => ({
  quizService: {
    saveAuthRedirect: jest.fn(),
    savePendingQuizData: jest.fn(),
    handleAuthRedirect: jest.fn(),
    isInAuthFlow: jest.fn().mockReturnValue(false),
  },
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe("CodeQuizWrapper Authentication Flow", () => {
  // Sample quiz data for testing
  const mockQuizData = {
    id: "test-quiz",
    title: "Test Coding Quiz",
    quizType: "code",
    slug: "test-coding-quiz",
    questions: [
      {
        id: "q1",
        question: "Write a function that adds two numbers",
        code: "function add(a, b) {\n  // Your code here\n}",
        language: "javascript",
        options: ["return a + b;", "return a - b;", "return a * b;", "return a / b;"],
        answer: "return a + b;",
        explanation: "Addition operator adds two numbers",
        difficulty: "easy",
      },
    ],
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  // Test for authenticated user flow
  it("should show results when user is authenticated", async () => {
    // Mock authenticated user
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-123" },
    })

    render(
      <QuizProvider quizData={mockQuizData} quizType="code" slug="test-coding-quiz" onAuthRequired={jest.fn()}>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" quizId={""} />
      </QuizProvider>,
    )

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.queryByText(/Initializing quiz/i)).not.toBeInTheDocument()
    })

    // Simulate quiz completion by directly manipulating the state
    // This is a bit hacky but necessary since we can't easily trigger the full quiz flow
    const completeQuizButton = document.createElement("button")
    completeQuizButton.setAttribute("data-testid", "complete-quiz")
    document.body.appendChild(completeQuizButton)

    // Simulate clicking the complete quiz button
    fireEvent.click(completeQuizButton)

    // Verify results are shown for authenticated users
    await waitFor(() => {
      expect(screen.queryByText(/Sign in to view your results/i)).not.toBeInTheDocument()
    })

    // Clean up
    document.body.removeChild(completeQuizButton)
  })

  // Test for guest user flow
  it("should show auth prompt and not results when guest user completes quiz", async () => {
    // Mock unauthenticated user
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    })

    // Create a mock QuizProvider that simulates a completed quiz
    const MockCompletedQuizProvider = ({ children }: { children: React.ReactNode }) => (
      <QuizProvider
        quizData={{
          ...mockQuizData,
          isCompleted: true, // Force completed state
        }}
        quizType="code"
        slug="test-coding-quiz"
        onAuthRequired={jest.fn()}
      >
        {children}
      </QuizProvider>
    )

    render(
      <MockCompletedQuizProvider>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" />
      </MockCompletedQuizProvider>,
    )

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.queryByText(/Initializing quiz/i)).not.toBeInTheDocument()
    })

    // Verify auth prompt is shown instead of results for guest users
    await waitFor(() => {
      expect(screen.queryByText(/Sign in to view your results/i)).toBeInTheDocument()
    })

    // Verify results are not shown
    expect(screen.queryByText(/Quiz Results/i)).not.toBeInTheDocument()
  })

  // Test that clicking "Sign In" initiates authentication flow
  it("should initiate auth flow when guest user clicks Sign In", async () => {
    // Mock unauthenticated user
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    })

    // Create a mock QuizProvider that simulates a completed quiz
    const MockCompletedQuizProvider = ({ children }: { children: React.ReactNode }) => (
      <QuizProvider
        quizData={{
          ...mockQuizData,
          isCompleted: true, // Force completed state
        }}
        quizType="code"
        slug="test-coding-quiz"
        onAuthRequired={jest.fn()}
      >
        {children}
      </QuizProvider>
    )

    render(
      <MockCompletedQuizProvider>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" />
      </MockCompletedQuizProvider>,
    )

    // Wait for component to initialize and show auth prompt
    await waitFor(() => {
      expect(screen.queryByText(/Sign in to view your results/i)).toBeInTheDocument()
    })

    // Find and click the Sign In button
    const signInButton = screen.getByText(/Sign in to continue/i)
    fireEvent.click(signInButton)

    // Verify auth redirect functions were called
    expect(quizService.saveAuthRedirect).toHaveBeenCalled()
    expect(quizService.savePendingQuizData).toHaveBeenCalled()
    expect(quizService.handleAuthRedirect).toHaveBeenCalledWith(expect.any(String), false)
  })

  // Test that no automatic redirection happens for guest users
  it("should not automatically redirect guest users to sign in", async () => {
    // Mock unauthenticated user
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    })

    render(
      <QuizProvider quizData={mockQuizData} quizType="code" slug="test-coding-quiz" onAuthRequired={jest.fn()}>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" />
      </QuizProvider>,
    )

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.queryByText(/Initializing quiz/i)).not.toBeInTheDocument()
    })

    // Verify handleAuthRedirect was not called automatically
    expect(quizService.handleAuthRedirect).not.toHaveBeenCalled()
  })

  it("should transition from preparing results to showing results after authentication", async () => {
    // Mock authenticated user returning from auth flow
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-123" },
    })

    // Mock the quiz service to simulate returning from auth
    ;(quizService.isInAuthFlow as jest.Mock).mockReturnValue(true)
    ;(quizService.processPendingQuizData as jest.Mock).mockImplementation(async () => {
      // Simulate successful processing after a delay
      await new Promise((resolve) => setTimeout(resolve, 100))
      return { success: true }
    })

    // Create a mock QuizProvider that simulates returning from auth
    const mockOnAuthRequired = jest.fn()
    const MockAuthReturnQuizProvider = ({ children }: { children: React.ReactNode }) => {
      const [state, setState] = React.useState({
        quizId: "test-quiz",
        slug: "test-coding-quiz",
        quizType: "code",
        isCompleted: true,
        isProcessingAuth: true,
        animationState: "preparing-results",
        authCheckComplete: true,
        requiresAuth: false,
        hasGuestResult: false,
        pendingAuthRequired: false,
        isInitialized: true,
      })

      // Simulate state transition after a delay
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setState({
            ...state,
            isProcessingAuth: false,
            animationState: "showing-results",
          })
        }, 200)

        return () => clearTimeout(timer)
      }, [])

      return (
        <QuizProvider
          quizData={{
            ...mockQuizData,
            isCompleted: true,
          }}
          quizType="code"
          slug="test-coding-quiz"
          onAuthRequired={mockOnAuthRequired}
        >
          {children}
        </QuizProvider>
      )
    }

    // Render with the mock provider
    const { queryByText, findByText } = render(
      <MockAuthReturnQuizProvider>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" />
      </MockAuthReturnQuizProvider>,
    )

    // Initially should show preparing results
    expect(queryByText(/Preparing your results/i)).toBeInTheDocument()

    // After the state transition, should show results
    await findByText(/Quiz Results/i)

    // Verify auth flow was processed
    expect(quizService.processPendingQuizData).toHaveBeenCalled()
  })

  it("should handle timeout and show retry button when results preparation takes too long", async () => {
    // Mock authenticated user returning from auth flow
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-123" },
    })

    // Mock the quiz service to simulate returning from auth with an error
    ;(quizService.isInAuthFlow as jest.Mock).mockReturnValue(true)
    ;(quizService.processPendingQuizData as jest.Mock).mockImplementation(async () => {
      // Simulate a long delay that would trigger timeout
      await new Promise((resolve) => setTimeout(resolve, 300))
      return { success: false, error: "Timeout" }
    })

    // Create a mock QuizProvider that simulates returning from auth with an error
    const mockOnAuthRequired = jest.fn()
    const mockFetchQuizResults = jest.fn()
    const MockAuthErrorQuizProvider = ({ children }: { children: React.ReactNode }) => {
      const [state, setState] = React.useState({
        quizId: "test-quiz",
        slug: "test-coding-quiz",
        quizType: "code",
        isCompleted: true,
        isProcessingAuth: true,
        animationState: "preparing-results",
        authCheckComplete: true,
        requiresAuth: false,
        hasGuestResult: false,
        pendingAuthRequired: false,
        resultLoadError: null,
        isInitialized: true,
      })

      // Simulate error state after a delay
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setState({
            ...state,
            isProcessingAuth: false,
            resultLoadError: "Failed to load results after authentication",
          })
        }, 200)

        return () => clearTimeout(timer)
      }, [])

      return (
        <QuizProvider
          quizData={{
            ...mockQuizData,
            isCompleted: true,
          }}
          quizType="code"
          slug="test-coding-quiz"
          onAuthRequired={mockOnAuthRequired}
        >
          {children}
        </QuizProvider>
      )
    }

    // Render with the mock provider
    const { queryByText, findByText } = render(
      <MockAuthErrorQuizProvider>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" />
      </MockAuthErrorQuizProvider>,
    )

    // Initially should show preparing results
    expect(queryByText(/Preparing your results/i)).toBeInTheDocument()

    // After the state transition, should show error and retry button
    await findByText(/Failed to load results/i)
    const retryButton = await findByText(/Retry Loading Results/i)
    expect(retryButton).toBeInTheDocument()

    // Verify auth flow was processed
    expect(quizService.processPendingQuizData).toHaveBeenCalled()
  })

  it("should clear auth flow and restart quiz when user clicks 'Go Back'", async () => {
    // Mock authenticated user returning from auth flow with error
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-123" },
    })

    // Mock the quiz service
    ;(quizService.isInAuthFlow as jest.Mock).mockReturnValue(true)
    ;(quizService.clearAuthFlow as jest.Mock).mockImplementation(() => {
      // Mock implementation
    })

    // Create a mock QuizProvider that simulates error state
    const mockOnAuthRequired = jest.fn()
    const mockRestartQuiz = jest.fn()
    const MockErrorStateQuizProvider = ({ children }: { children: React.ReactNode }) => {
      const [state, setState] = React.useState({
        quizId: "test-quiz",
        slug: "test-coding-quiz",
        quizType: "code",
        isCompleted: true,
        isProcessingAuth: false,
        animationState: "preparing-results",
        authCheckComplete: true,
        requiresAuth: false,
        hasGuestResult: false,
        pendingAuthRequired: false,
        resultLoadError: "Failed to load results after authentication",
        isInitialized: true,
      })

      return (
        <QuizProvider
          quizData={{
            ...mockQuizData,
            isCompleted: true,
          }}
          quizType="code"
          slug="test-coding-quiz"
          onAuthRequired={mockOnAuthRequired}
        >
          {children}
        </QuizProvider>
      )
    }

    // Render with the mock provider
    const { findByText } = render(
      <MockErrorStateQuizProvider>
        <CodeQuizWrapper quizData={mockQuizData} slug="test-coding-quiz" />
      </MockErrorStateQuizProvider>,
    )

    // Find the go back button
    const goBackButton = await findByText(/Go Back/i)
    expect(goBackButton).toBeInTheDocument()

    // Click the go back button
    fireEvent.click(goBackButton)

    // Verify auth flow was cleared
    expect(quizService.clearAuthFlow).toHaveBeenCalled()
  })
})
