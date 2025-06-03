import React from "react"
import { render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import configureStore from "redux-mock-store"
import QuizAuthGuard from "./QuizAuthGuard"

// Mock useRouter from next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}))

// Mock useSessionService
const saveAuthRedirectState = jest.fn()
jest.mock("@/hooks/useSessionService", () => ({
  useSessionService: () => ({
    saveAuthRedirectState,
  }),
}))

// Minimal quizSlice selectors
const initialState = {
  auth: { isAuthenticated: true },
  quiz: {
    isQuizComplete: true,
    quizResults: { score: 100 },
    quizStatus: "succeeded",
    quizError: null,
    quizId: "test-quiz",
  },
}

const mockStore = configureStore([])

describe("QuizAuthGuard", () => {
  it("renders children when authenticated and quiz is complete", () => {
    const store = mockStore(initialState)
    render(
      <Provider store={store}>
        <QuizAuthGuard>
          <div>Quiz Results Content</div>
        </QuizAuthGuard>
      </Provider>
    )
    expect(screen.getByText("Quiz Results Content")).toBeInTheDocument()
  })

  it("shows denied message if quiz is not complete", () => {
    const store = mockStore({
      ...initialState,
      quiz: { ...initialState.quiz, isQuizComplete: false },
    })
    render(
      <Provider store={store}>
        <QuizAuthGuard deniedMessage="Denied!">
          <div>Should not render</div>
        </QuizAuthGuard>
      </Provider>
    )
    expect(screen.getByText("Denied!")).toBeInTheDocument()
    expect(screen.queryByText("Should not render")).not.toBeInTheDocument()
  })

  it("redirects to login if not authenticated", () => {
    const store = mockStore({
      ...initialState,
      auth: { isAuthenticated: false },
    })
    render(
      <Provider store={store}>
        <QuizAuthGuard>
          <div>Should not render</div>
        </QuizAuthGuard>
      </Provider>
    )
    // Children should not render
    expect(screen.queryByText("Should not render")).not.toBeInTheDocument()
    // saveAuthRedirectState should be called
    expect(saveAuthRedirectState).toHaveBeenCalled()
  })
})
