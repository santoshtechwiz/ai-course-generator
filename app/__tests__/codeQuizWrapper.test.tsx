import { render, screen, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"
import { useRouter } from "next/navigation"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"
import * as QuizContext from "../context/QuizContext"

// Mock the next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock the QuizContext
jest.mock("@/context/QuizContext", () => {
  const originalModule = jest.requireActual("@/context/QuizContext")
  return {
    ...originalModule,
    useQuiz: jest.fn(),
    QuizProvider: ({ children }) => children,
  }
})

// Mock the animation provider
jest.mock("@/providers/animation-provider", () => ({
  useAnimation: () => ({ animationsEnabled: false }),
}))

// Mock the auth provider
jest.mock("@/providers/unified-auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}))

// Sample quiz data
const mockQuizData = {
  id: "quiz-123",
  title: "Test Code Quiz",
  description: "A test code quiz",
  questions: [
    {
      id: "q1",
      question: 'What is the output of console.log(1 + "1")?',
      codeSnippet: 'console.log(1 + "1");',
      options: ["2", "11", "NaN", "undefined"],
      correctAnswer: "11",
      language: "javascript",
    },
    {
      id: "q2",
      question: "Complete the function to return the sum of two numbers",
      codeSnippet: "function add(a, b) {\n  // Your code here\n}",
      answer: "return a + b",
      language: "javascript",
    },
  ],
  isPublic: true,
  isFavorite: false,
  userId: "user-123",
  difficulty: "medium",
  slug: "test-code-quiz",
}

describe("CodeQuizWrapper", () => {
  let mockRouter
  let mockUseQuiz

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup router mock
    mockRouter = {
      push: jest.fn(),
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Setup QuizContext mock
    mockUseQuiz = {
      state: {
        currentQuestionIndex: 0,
        isLoading: false,
        error: null,
        isCompleted: false,
        answers: [],
        requiresAuth: false,
        isAuthenticated: false,
        isProcessingAuth: false,
        hasGuestResult: false,
        isSavingResults: false,
      },
      submitAnswer: jest.fn(),
      nextQuestion: jest.fn(),
      completeQuiz: jest.fn(),
      restartQuiz: jest.fn(),
      handleAuthenticationRequired: jest.fn(),
    }
    ;(QuizContext.useQuiz as jest.Mock).mockReturnValue(mockUseQuiz)
  })

  it("renders initialization state correctly", () => {
    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={mockQuizData}
          slug="test-code-quiz"
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    expect(screen.getByText(/Initializing/i)).toBeInTheDocument()
  })

  it("renders quiz not found when slug is invalid", async () => {
    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={mockQuizData}
          slug=""
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText(/Quiz not found/i)).toBeInTheDocument()
    })
  })

  it("renders empty questions message when questions array is empty", async () => {
    const emptyQuizData = { ...mockQuizData, questions: [] }

    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={emptyQuizData}
          slug="test-code-quiz"
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText(/No questions found/i)).toBeInTheDocument()
    })
  })

  it("renders error state correctly", async () => {
    mockUseQuiz.state.error = "Test error message"

    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={mockQuizData}
          slug="test-code-quiz"
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText(/Test error message/i)).toBeInTheDocument()
    })
  })

  it("renders quiz content when initialized", async () => {
    // Set process.env.NODE_ENV to 'test' to skip initialization delay
    process.env.NODE_ENV = "test"

    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={mockQuizData}
          slug="test-code-quiz"
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText(/What is the output/i)).toBeInTheDocument()
    })
  })

  it("renders auth prompt when requiresAuth is true and user is not authenticated", async () => {
    // Set process.env.NODE_ENV to 'test' to skip initialization delay
    process.env.NODE_ENV = "test"

    mockUseQuiz.state.requiresAuth = true
    mockUseQuiz.state.isAuthenticated = false

    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={mockQuizData}
          slug="test-code-quiz"
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByText(/Sign in to view your results/i)).toBeInTheDocument()
    })
  })

  it("renders results when quiz is completed", async () => {
    // Set process.env.NODE_ENV to 'test' to skip initialization delay
    process.env.NODE_ENV = "test"

    mockUseQuiz.state.isCompleted = true

    render(
      <SessionProvider session={null}>
        <CodeQuizWrapper
          quizData={mockQuizData}
          slug="test-code-quiz"
          userId="user-123"
          quizId="quiz-123"
          isPublic={true}
          isFavorite={false}
        />
      </SessionProvider>,
    )

    // Wait for initialization to complete
    await waitFor(() => {
      // This would be a text in the CodeQuizResult component
      expect(screen.getByText(/Guest Mode/i)).toBeInTheDocument()
    })
  })
})
