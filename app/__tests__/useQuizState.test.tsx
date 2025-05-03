import { renderHook, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import quizReducer from "@/store/slices/quizSlice"
import useQuizState from "@/hooks/useQuizState"

// Mock the quiz service
jest.mock("@/lib/quiz-service", () => ({
  submitQuizResults: jest.fn().mockResolvedValue({ data: { success: true } }),
  saveGuestQuizResults: jest.fn().mockReturnValue({ data: { success: true } }),
  clearGuestQuizResults: jest.fn().mockReturnValue({ data: { success: true } }),
}))

// Mock quiz data
const mockQuizData = {
  id: "test-quiz-id",
  slug: "test-quiz",
  title: "Test Quiz",
  quizType: "mcq",
  questions: [
    { id: "q1", question: "Question 1", answer: "A" },
    { id: "q2", question: "Question 2", answer: "B" },
  ],
}

// Create a wrapper component with Redux provider
const createWrapper = (initialState = {}) => {
  const store = configureStore({
    reducer: {
      quiz: quizReducer,
    },
    preloadedState: {
      quiz: {
        quizId: "",
        slug: "",
        title: "",
        quizType: "",
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        timeSpent: [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
        isAuthenticated: false,
        error: null,
        animationState: "idle",
        ...initialState,
      },
    },
  })

  return ({ children }) => <Provider store={store}>{children}</Provider>
}

describe("useQuizState Hook", () => {
  it("should initialize quiz state", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.initializeQuiz(mockQuizData)
    })

    expect(result.current.state.quizId).toBe(mockQuizData.id)
    expect(result.current.state.slug).toBe(mockQuizData.slug)
    expect(result.current.state.title).toBe(mockQuizData.title)
    expect(result.current.state.quizType).toBe(mockQuizData.quizType)
    expect(result.current.state.questions).toEqual(mockQuizData.questions)
    expect(result.current.state.currentQuestionIndex).toBe(0)
    expect(result.current.state.answers).toEqual([null, null])
    expect(result.current.state.timeSpent).toEqual([0, 0])
    expect(result.current.state.isCompleted).toBe(false)
  })

  it("should submit an answer", () => {
    const wrapper = createWrapper({
      questions: mockQuizData.questions,
      answers: [null, null],
      timeSpent: [0, 0],
    })
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.submitAnswer("A", 10, true)
    })

    expect(result.current.state.answers[0]).toEqual({ answer: "A", timeSpent: 10, isCorrect: true })
    expect(result.current.state.timeSpent[0]).toBe(10)
    expect(result.current.state.animationState).toBe("answering")
  })

  it("should move to the next question", () => {
    const wrapper = createWrapper({
      questions: mockQuizData.questions,
      currentQuestionIndex: 0,
      answers: [{ answer: "A", timeSpent: 10, isCorrect: true }, null],
      timeSpent: [10, 0],
    })
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.nextQuestion()
    })

    expect(result.current.state.currentQuestionIndex).toBe(1)
  })

  it("should complete the quiz", async () => {
    const answers = [
      { answer: "A", timeSpent: 10, isCorrect: true },
      { answer: "C", timeSpent: 15, isCorrect: false },
    ]

    const wrapper = createWrapper({
      questions: mockQuizData.questions,
      answers: answers,
      timeSpent: [10, 15],
    })
    const { result } = renderHook(() => useQuizState(), { wrapper })

    await act(async () => {
      await result.current.completeQuiz()
    })

    expect(result.current.state.answers).toEqual(answers)
    expect(result.current.state.isCompleted).toBe(true)
    expect(result.current.state.score).toBe(50) // 1 out of 2 correct = 50%
  })

  it("should restart the quiz", () => {
    const wrapper = createWrapper({
      questions: mockQuizData.questions,
      currentQuestionIndex: 1,
      answers: [
        { answer: "A", timeSpent: 10, isCorrect: true },
        { answer: "B", timeSpent: 15, isCorrect: true },
      ],
      timeSpent: [10, 15],
      isCompleted: true,
      score: 100,
    })
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.restartQuiz()
    })

    expect(result.current.state.currentQuestionIndex).toBe(0)
    expect(result.current.state.answers).toEqual([null, null])
    expect(result.current.state.timeSpent).toEqual([0, 0])
    expect(result.current.state.isCompleted).toBe(false)
    expect(result.current.state.score).toBe(0)
  })

  it("should handle authentication requirement", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.setRequiresAuth(true)
    })

    expect(result.current.state.requiresAuth).toBe(true)

    act(() => {
      result.current.setIsAuthenticated(true)
    })

    expect(result.current.state.isAuthenticated).toBe(true)
  })

  it("should clear guest results", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuizState(), { wrapper })

    act(() => {
      result.current.clearGuestResults()
    })

    // This is mostly testing that the function doesn't throw
    expect(result.current.state.guestResultsSaved).toBe(false)
  })
})
