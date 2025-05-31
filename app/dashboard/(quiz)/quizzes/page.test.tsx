import { render, screen, waitFor } from "@testing-library/react"
import { MockedProvider } from "@apollo/client/testing"

import QuizPage from "./page"
import { getAuthSession } from "@/lib/auth"
import { getQuizzes } from "@/app/actions/getQuizes"

// Mock the getAuthSession and getQuizzes functions
jest.mock("@/lib/auth", () => ({
  getAuthSession: jest.fn(),
}))

jest.mock("@/app/actions/getQuizes", () => ({
  getQuizzes: jest.fn(),
}))

describe("QuizPage", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it("renders the component and displays loading state", async () => {
    // Mock getAuthSession to return a session
    ;(getAuthSession as jest.Mock).mockResolvedValue({
      user: {
        id: "test-user-id",
      },
    })

    // Mock getQuizzes to return no quizzes
    ;(getQuizzes as jest.Mock).mockResolvedValue({
      quizzes: [],
      nextCursor: null,
    })

    render(
      <MockedProvider>
        <QuizPage />
      </MockedProvider>,
    )

    // Check if the loading text is displayed
    expect(screen.getByText("Loading quizzes...")).toBeInTheDocument()

    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading quizzes...")).not.toBeInTheDocument()
    })

    // Check if the component renders without crashing
    expect(screen.getByText("Explore Quizzes")).toBeInTheDocument()
  })

  it("renders the component with no user session", async () => {
    // Mock getAuthSession to return null (no session)
    ;(getAuthSession as jest.Mock).mockResolvedValue(null)

    // Mock getQuizzes to return no quizzes
    ;(getQuizzes as jest.Mock).mockResolvedValue({
      quizzes: [],
      nextCursor: null,
    })

    render(
      <MockedProvider>
        <QuizPage />
      </MockedProvider>,
    )

    // Check if the loading text is displayed
    expect(screen.getByText("Loading quizzes...")).toBeInTheDocument()

    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading quizzes...")).not.toBeInTheDocument()
    })

    // Check if the component renders without crashing
    expect(screen.getByText("Explore Quizzes")).toBeInTheDocument()
  })

  it("renders the component with quizzes", async () => {
    // Mock getAuthSession to return a session
    ;(getAuthSession as jest.Mock).mockResolvedValue({
      user: {
        id: "test-user-id",
      },
    })

    // Mock getQuizzes to return some quizzes
    ;(getQuizzes as jest.Mock).mockResolvedValue({
      quizzes: [
        {
          id: "quiz-1",
          title: "Quiz 1",
          description: "Description 1",
          quizType: "mcq",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "test-user-id",
          questions: [],
        },
        {
          id: "quiz-2",
          title: "Quiz 2",
          description: "Description 2",
          quizType: "open_ended",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "test-user-id",
          questions: [],
        },
      ],
      nextCursor: null,
    })

    render(
      <MockedProvider>
        <QuizPage />
      </MockedProvider>,
    )

    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText("Loading quizzes...")).not.toBeInTheDocument()
    })

    // Check if the component renders without crashing
    expect(screen.getByText("Explore Quizzes")).toBeInTheDocument()

    // Check if the quizzes are rendered
    expect(screen.getByText("Quiz 1")).toBeInTheDocument()
    expect(screen.getByText("Quiz 2")).toBeInTheDocument()
  })
})
