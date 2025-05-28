import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import configureStore from "redux-mock-store"
import McqResultsPage from "./page"

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}))
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}))

const mockStore = configureStore([])

describe("MCQ Results Page Auth & Restoration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.location for redirect test
    delete (window as any).location
    ;(window as any).location = { href: "" }
  })

  it("redirects to login if not authenticated", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" })
    const store = mockStore({
      quiz: { results: null, questions: [], answers: {}, status: "idle" }
    })
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(window.location.href).toMatch(/\/auth\/signin\?callbackUrl=/)
    })
  })

  it("shows results if authenticated and quizResults present", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" })
    const store = mockStore({
      quiz: {
        results: { score: 2, maxScore: 3, percentage: 67, slug: "test-quiz", title: "Test Quiz", completedAt: new Date().toISOString() },
        questions: [{ id: "1", question: "Q1", options: ["A", "B"], correctOptionId: "A" }],
        answers: { "1": { selectedOptionId: "A", isCorrect: true } },
        status: "idle"
      }
    })
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/Test Quiz/i)).toBeInTheDocument()
      expect(screen.getByText(/67%/i)).toBeInTheDocument()
    })
  })

  it("prevents access if no quiz state", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" })
    const store = mockStore({
      quiz: { results: null, questions: [], answers: {}, status: "idle" }
    })
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/No Results Found/i)).toBeInTheDocument()
    })
  })

  it("restores quiz from Redux after login", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" })
    const store = mockStore({
      quiz: {
        results: { score: 1, maxScore: 1, percentage: 100, slug: "test-quiz", title: "Test Quiz", completedAt: new Date().toISOString() },
        questions: [{ id: "1", question: "Q1", options: ["A", "B"], correctOptionId: "A" }],
        answers: { "1": { selectedOptionId: "A", isCorrect: true } },
        status: "idle"
      }
    })
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    await waitFor(() => {
      expect(screen.getByText(/100%/i)).toBeInTheDocument()
    })
  })
})
