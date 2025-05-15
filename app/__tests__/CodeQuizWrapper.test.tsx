"use client"

import { render, screen, waitFor, fireEvent } from "@testing-library/react"

import { useSession } from "next-auth/react"
import { useQuiz } from "@/hooks/useQuizState"
import { useRouter } from "next/navigation"
import CodeQuizWrapper from "../dashboard/(quiz)/code/components/CodeQuizWrapper"

// Mock the dependencies
jest.mock("next-auth/react")
jest.mock("@/hooks/useQuizState")
jest.mock("next/navigation")
jest.mock("@/components/CodingQuiz", () => ({
  __esModule: true,
  default: ({ question, questionNumber, totalQuestions, onAnswer }) => (
    <div data-testid="coding-quiz">
      <h2>
        Question {questionNumber} of {totalQuestions}
      </h2>
      <p>{question.question}</p>
      <button onClick={() => onAnswer("test answer", 10, true)}>Submit Answer</button>
    </div>
  ),
}))

describe("CodeQuizWrapper", () => {
  // Setup common mocks
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  }
  const mockLoadQuiz = jest.fn()
  const mockSubmitAnswer = jest.fn()
  const mockSubmitQuiz = jest.fn()
  const mockNextQuestion = jest.fn()

  const mockQuizData = {
    id: "quiz-1",
    title: "Test Quiz",
    questions: [
      {
        id: "q1",
        question: "Test question 1",
        codeSnippet: "console.log('test')",
        language: "javascript",
      },
      {
        id: "q2",
        question: "Test question 2",
        codeSnippet: "print('test')",
        language: "python",
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Mock useQuiz
    ;(useQuiz as jest.Mock).mockReturnValue({
      quizData: null,
      currentQuestion: 0,
      isCompleted: false,
      error: null,
      loadQuiz: mockLoadQuiz,
      submitAnswer: mockSubmitAnswer,
      submitQuiz: mockSubmitQuiz,
      nextQuestion: mockNextQuestion,
    })

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { pathname: "/dashboard/code/test-quiz" },
      writable: true,
    })

    // Mock sessionStorage
    Storage.prototype.setItem = jest.fn()
  })

  test("redirects to login if not authenticated", async () => {
    // Mock unauthenticated session
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    render(<CodeQuizWrapper quizData={null} slug="test-quiz" userId="" quizId="" />)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"))
      expect(sessionStorage.setItem).toHaveBeenCalledWith("quizRedirectPath", "/dashboard/code/test-quiz")
    })
  })

  test("uses initial quiz data if available", async () => {
    // Mock authenticated session
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    render(<CodeQuizWrapper quizData={mockQuizData} slug="test-quiz" userId="user-1" quizId="quiz-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument()
      expect(mockLoadQuiz).not.toHaveBeenCalled() // Should not call loadQuiz if initial data exists
    })
  })

  test("loads quiz data from API if initial data is not available", async () => {
    // Mock authenticated session
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Mock successful quiz loading
    mockLoadQuiz.mockResolvedValue(mockQuizData)

    render(<CodeQuizWrapper quizData={null} slug="test-quiz" userId="user-1" quizId="quiz-1" />)

    await waitFor(() => {
      expect(mockLoadQuiz).toHaveBeenCalledWith("test-quiz", "code")
    })
  })

  test("handles answer submission correctly", async () => {
    // Mock authenticated session
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Mock successful answer submission
    mockSubmitAnswer.mockResolvedValue({ success: true })

    render(<CodeQuizWrapper quizData={mockQuizData} slug="test-quiz" userId="user-1" quizId="quiz-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
    })

    // Submit an answer
    fireEvent.click(screen.getByText("Submit Answer"))

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: "q1",
          answer: "test answer",
          slug: "test-quiz",
        }),
      )
      expect(mockNextQuestion).toHaveBeenCalled()
    })
  })

  test("submits quiz and redirects to results on last question", async () => {
    // Mock authenticated session
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    // Create quiz data with only one question
    const singleQuestionQuiz = {
      ...mockQuizData,
      questions: [mockQuizData.questions[0]],
    }

    // Mock successful quiz submission
    mockSubmitAnswer.mockResolvedValue({ success: true })
    mockSubmitQuiz.mockResolvedValue({ success: true })

    render(<CodeQuizWrapper quizData={singleQuestionQuiz} slug="test-quiz" userId="user-1" quizId="quiz-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("coding-quiz")).toBeInTheDocument()
      expect(screen.getByText("Question 1 of 1")).toBeInTheDocument()
    })

    // Submit the last answer
    fireEvent.click(screen.getByText("Submit Answer"))

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalled()
      expect(mockSubmitQuiz).toHaveBeenCalled()
      expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard/code/test-quiz/results")
    })
  })
})
