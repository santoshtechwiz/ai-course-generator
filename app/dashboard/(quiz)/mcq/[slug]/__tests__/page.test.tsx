import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import configureStore from "redux-mock-store"
import McqQuizPage from "../page"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { id: "user1" } }),
}))

global.fetch = jest.fn()

const mockStore = configureStore([])

describe("McqQuizPage", () => {
  let store: any

  beforeEach(() => {
    store = mockStore({
      quiz: {
        quizId: null,
        quizType: null,
        title: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        status: "idle",
        error: null,
        isCompleted: false,
        results: null,
        sessionId: "session1",
        pendingQuiz: null,
      },
    })
    jest.clearAllMocks()
    // Mock window.location to suppress navigation errors
    Object.defineProperty(window, 'location', {
      value: { href: '', assign: jest.fn() },
      writable: true,
    })
  })

  it("shows loading state while fetching", () => {
    (fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(
      <Provider store={store}>
        <McqQuizPage params={{ slug: "quiz1" }} />
      </Provider>
    )
    expect(screen.getByText(/Fetching quiz data/i)).toBeInTheDocument()
  })

  it("shows error if quiz fails to load", async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
    render(
      <Provider store={store}>
        <McqQuizPage params={{ slug: "quiz1" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText((content) => /not found/i.test(content))).toBeInTheDocument()
    })
  })

  it("shows quiz not found if no quiz data", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: null, questions: [] }),
    })
    render(
      <Provider store={store}>
        <McqQuizPage params={{ slug: "quiz1" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(
        screen.getByText((content) => /no questions available for this quiz/i.test(content))
      ).toBeInTheDocument()
    })
  })

  it("renders quiz wrapper with loaded data", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "quiz1",
        title: "Loaded Quiz",
        questions: [
          { id: "q1", question: "Q1?", options: [{ id: "a", text: "A" }], correctOptionId: "a" },
        ],
      }),
    })
    render(
      <Provider store={store}>
        <McqQuizPage params={{ slug: "quiz1" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText((content) => /loaded quiz/i.test(content))).toBeInTheDocument()
    })
  })
})
