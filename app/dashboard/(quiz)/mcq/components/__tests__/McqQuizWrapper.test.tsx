import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import configureStore from "redux-mock-store"
import McqQuizWrapper from "../McqQuizWrapper"
import * as nextAuth from "next-auth/react"
import * as nextRouter from "next/navigation"

// Mock thunks as plain actions
jest.mock('@/store/slices/quizSlice', () => ({
  ...jest.requireActual('@/store/slices/quizSlice'),
  fetchQuiz: () => ({ type: 'quiz/fetchQuiz' }),
  submitQuiz: () => ({ type: 'quiz/submitQuiz' }),
  fetchQuizResults: () => ({ type: 'quiz/fetchQuizResults' }),
}))

// Remove thunk from mockStore
const mockStore = configureStore([])

jest.mock("next-auth/react")
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}))

describe("McqQuizWrapper", () => {
  const quizData = {
    id: "quiz1",
    title: "Sample Quiz",
    questions: [
      { id: "q1", text: "Q1?", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctOptionId: "a" },
      { id: "q2", text: "Q2?", options: [{ id: "c", text: "C" }, { id: "d", text: "D" }], correctOptionId: "d" },
    ],
  }

  let store: any

  beforeEach(() => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({ status: "authenticated" })
    ;(nextRouter.useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), replace: jest.fn() })
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
    sessionStorage.clear()
    // Mock window.location for redirect test
    delete (window as any).location
    ;(window as any).location = { href: "" }
  })

  it("redirects unauthenticated users to login with callbackUrl", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" })
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    await waitFor(() => {
      expect(window.location.href).toMatch(/\/auth\/signin\?callbackUrl=/)
      expect(sessionStorage.getItem("pendingQuiz")).toBeTruthy()
    })
  })

  it("restores quiz from pendingQuiz after login", async () => {
    store = mockStore({
      quiz: {
        ...store.getState().quiz,
        pendingQuiz: { slug: "quiz1", quizData },
      },
    })
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    await waitFor(() => {
      expect(
        screen.getByText((content) => /no questions available for this quiz/i.test(content))
      ).toBeInTheDocument()
    })
  })

  it("renders quiz and allows saving an answer", async () => {
    store = mockStore({
      quiz: {
        ...store.getState().quiz,
        quizId: "quiz1",
        questions: quizData.questions,
        title: "Sample Quiz",
        status: "idle",
      },
    })
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    await waitFor(() => {
      expect(
        screen.getByText((content) => /sample quiz|multiple choice quiz/i.test(content))
      ).toBeInTheDocument()
      expect(screen.getByText(/Q1\?/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("A"))
    fireEvent.click(screen.getByText(/Save Answer/i))
    await waitFor(() => {
      expect(screen.getByText(/Answer saved!/i)).toBeInTheDocument()
    })
  })

  it("submits quiz and redirects to results", async () => {
    const routerPush = jest.fn()
    ;(nextRouter.useRouter as jest.Mock).mockReturnValue({ push: routerPush, replace: jest.fn() })
    store = mockStore({
      quiz: {
        ...store.getState().quiz,
        quizId: "quiz1",
        questions: quizData.questions,
        title: "Sample Quiz",
        status: "idle",
        isCompleted: true,
        results: null,
        answers: { q1: { selectedOptionId: "a", type: "mcq", isCorrect: true } },
      },
    })
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/dashboard/mcq/quiz1/results")
    })
  })

  it("shows loading and error states", () => {
    store = mockStore({
      quiz: { ...store.getState().quiz, status: "loading" },
    })
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    expect(screen.getByText(/Fetching quiz data/i)).toBeInTheDocument()

    store = mockStore({
      quiz: { ...store.getState().quiz, status: "error", error: "Failed" },
    })
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    expect(screen.getByText(/Failed/i)).toBeInTheDocument()
  })

  it("handles corrupted sessionStorage gracefully", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({ status: "authenticated" })
    sessionStorage.setItem("pendingQuiz", "{bad json")
    render(
      <Provider store={store}>
        <McqQuizWrapper slug="quiz1" quizData={quizData} />
      </Provider>
    )
    await waitFor(() => {
      expect(
        screen.getByText((content) => /initializing quiz/i.test(content))
      ).toBeInTheDocument()
    })
  })
})
