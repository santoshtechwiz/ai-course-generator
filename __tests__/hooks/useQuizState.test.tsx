import type React from "react"
import { renderHook, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { signIn } from "next-auth/react"
import { useQuiz } from "../use-quiz"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

// Mock quiz classes
const mockCodeQuiz = jest.fn().mockImplementation(() => ({
  type: "code",
  validate: jest.fn(),
}))

const mockMCQQuiz = jest.fn().mockImplementation(() => ({
  type: "mcq",
  validate: jest.fn(),
}))

const mockBlanksQuiz = jest.fn().mockImplementation(() => ({
  type: "blanks",
  validate: jest.fn(),
}))

jest.mock("@/lib/quiz/CodeQuiz", () => ({
  CodeQuiz: mockCodeQuiz,
}))

jest.mock("@/lib/quiz/MCQQuiz", () => ({
  MCQQuiz: mockMCQQuiz,
}))

jest.mock("@/lib/quiz/BlanksQuiz", () => ({
  BlanksQuiz: mockBlanksQuiz,
}))

// Create mock actions
const mockFetchQuiz = jest.fn()
const mockSubmitQuiz = jest.fn()
const mockSetCurrentQuestion = jest.fn()
const mockSetUserAnswer = jest.fn()
const mockMarkQuizCompleted = jest.fn()
const mockSetTempResults = jest.fn()
const mockClearTempResults = jest.fn()
const mockClearErrors = jest.fn()
const mockResetQuizState = jest.fn()

// Create mock selectors
const mockSelectCurrentQuestionData = jest.fn()
const mockSelectQuizProgress = jest.fn()
const mockSelectIsLastQuestion = jest.fn()

// Mock the store hooks
const mockDispatch = jest.fn()
const mockUseAppSelector = jest.fn()

jest.mock("@/store", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => mockUseAppSelector,
}))

// Mock the quiz slice
jest.mock("@/store/slices/quizSlice", () => ({
  fetchQuiz: mockFetchQuiz,
  submitQuiz: mockSubmitQuiz,
  setCurrentQuestion: mockSetCurrentQuestion,
  setUserAnswer: mockSetUserAnswer,
  markQuizCompleted: mockMarkQuizCompleted,
  setTempResults: mockSetTempResults,
  clearTempResults: mockClearTempResults,
  clearErrors: mockClearErrors,
  resetQuizState: mockResetQuizState,
  selectCurrentQuestionData: mockSelectCurrentQuestionData,
  selectQuizProgress: mockSelectQuizProgress,
  selectIsLastQuestion: mockSelectIsLastQuestion,
}))

// Create test wrapper
const createWrapper = () => {
  const store = configureStore({
    reducer: {
      quiz: (state = {}, action) => state,
    },
  })

  return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
}

describe("useQuiz Hook", () => {
  const mockQuizData = {
    id: "test-quiz",
    title: "Test Quiz",
    slug: "test-quiz",
    type: "mcq" as const,
    questions: [
      {
        id: "q1",
        question: "Question 1",
        type: "multiple-choice" as const,
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
      },
      {
        id: "q2",
        question: "Question 2",
        type: "multiple-choice" as const,
        options: ["A", "B", "C", "D"],
        correctAnswer: "B",
      },
      {
        id: "q3",
        question: "Question 3",
        type: "multiple-choice" as const,
        options: ["A", "B", "C", "D"],
        correctAnswer: "C",
      },
    ],
    isPublic: true,
    isFavorite: false,
    ownerId: "owner1",
    timeLimit: 10,
  }

  const mockQuizState = {
    quizData: mockQuizData,
    currentQuestion: 0,
    currentQuizSlug: "test-quiz",
    currentQuizId: "test-quiz",
    currentQuizType: "mcq" as const,
    userAnswers: [],
    isLoading: false,
    isSubmitting: false,
    isCompleted: false,
    timerActive: false,
    submissionStateInProgress: false,
    results: null,
    tempResults: null,
    quizHistory: [],
    timeRemaining: null,
    errors: {
      quiz: null,
      submission: null,
      results: null,
      history: null,
    },
    hasMoreHistory: true,
    authRedirectState: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock implementations
    mockUseAppSelector.mockImplementation((selector) => {
      if (selector === mockSelectCurrentQuestionData) {
        return mockQuizData.questions[0]
      }
      if (selector === mockSelectQuizProgress) {
        return 0
      }
      if (selector === mockSelectIsLastQuestion) {
        return false
      }
      // Default selector for state
      return selector({ quiz: mockQuizState })
    })

    mockDispatch.mockImplementation((action) => {
      if (typeof action === "function") {
        return action(mockDispatch, () => ({ quiz: mockQuizState }))
      }
      return action
    })

    // Setup action creators to return proper action objects
    mockFetchQuiz.mockReturnValue({
      type: "quiz/fetchQuiz",
      unwrap: jest.fn().mockResolvedValue(mockQuizData),
    })

    mockSubmitQuiz.mockReturnValue({
      type: "quiz/submitQuiz",
      unwrap: jest.fn().mockResolvedValue({
        score: 10,
        totalQuestions: 3,
        correctAnswers: 2,
        totalTime: 120,
        results: { detailed: "results" },
      }),
    })

    mockSetCurrentQuestion.mockReturnValue({
      type: "quiz/setCurrentQuestion",
      payload: 0,
    })

    mockSetUserAnswer.mockReturnValue({
      type: "quiz/setUserAnswer",
      payload: { questionId: "q1", answer: "A" },
    })

    mockMarkQuizCompleted.mockReturnValue({
      type: "quiz/markQuizCompleted",
      payload: {},
    })

    mockSetTempResults.mockReturnValue({
      type: "quiz/setTempResults",
      payload: {},
    })

    mockClearTempResults.mockReturnValue({
      type: "quiz/clearTempResults",
    })

    mockClearErrors.mockReturnValue({
      type: "quiz/clearErrors",
    })

    mockResetQuizState.mockReturnValue({
      type: "quiz/resetQuizState",
    })
  })

  it("should return the correct quiz state and actions", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    expect(result.current.quiz).toEqual({
      data: expect.objectContaining({
        id: "test-quiz",
        title: "Test Quiz",
      }),
      currentQuestion: 0,
      currentQuestionData: expect.objectContaining({ id: "q1", question: "Question 1" }),
      userAnswers: [],
      isLastQuestion: false,
      progress: 0,
      instance: expect.any(Object),
    })

    expect(result.current.status).toEqual({
      isLoading: false,
      isSubmitting: false,
      isCompleted: false,
      hasError: false,
      errorMessage: null,
    })

    expect(result.current.results).toBeNull()
    expect(result.current.tempResults).toBeNull()

    // Check that all actions are functions
    expect(typeof result.current.actions.loadQuiz).toBe("function")
    expect(typeof result.current.actions.submitQuiz).toBe("function")
    expect(typeof result.current.actions.saveAnswer).toBe("function")
    expect(typeof result.current.actions.setTempResults).toBe("function")
    expect(typeof result.current.actions.clearTempResults).toBe("function")
    expect(typeof result.current.actions.reset).toBe("function")

    // Check that all navigation functions are functions
    expect(typeof result.current.navigation.next).toBe("function")
    expect(typeof result.current.navigation.previous).toBe("function")
    expect(typeof result.current.navigation.toQuestion).toBe("function")
  })

  it("should call loadQuiz with correct parameters", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    await act(async () => {
      await result.current.actions.loadQuiz("test-quiz", "mcq")
    })

    expect(mockClearErrors).toHaveBeenCalled()
    expect(mockFetchQuiz).toHaveBeenCalledWith({ slug: "test-quiz", type: "mcq" })
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/clearErrors" }))
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/fetchQuiz" }))
  })

  it("should handle loadQuiz with initial data", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    const initialData = {
      id: "test-quiz",
      title: "Test Quiz",
      slug: "test-quiz",
      type: "mcq" as const,
      questions: [
        { id: "q1", question: "Question 1", type: "multiple-choice" as const, options: ["A", "B"], correctAnswer: "A" },
      ],
      isPublic: true,
      isFavorite: false,
      ownerId: "owner1",
      timeLimit: 10,
    }

    let loadedData: any
    await act(async () => {
      loadedData = await result.current.actions.loadQuiz("test-quiz", "mcq", initialData)
    })

    expect(loadedData).toEqual(initialData)
  })

  it("should handle loadQuiz error and redirect to sign-in if unauthorized", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    // Mock fetchQuiz to reject with unauthorized error
    mockFetchQuiz.mockReturnValueOnce({
      type: "quiz/fetchQuiz",
      unwrap: jest.fn().mockRejectedValue("Unauthorized"),
    })

    await act(async () => {
      try {
        await result.current.actions.loadQuiz("test-quiz", "mcq")
      } catch (error) {
        expect(error).toBe("Unauthorized")
      }
    })

    expect(signIn).toHaveBeenCalledWith(undefined, {
      callbackUrl: "/dashboard/mcq/test-quiz",
    })
  })

  it("should call submitQuiz with correct parameters", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    const payload = {
      type: "mcq" as const,
      answers: [{ questionId: "q1", answer: "A", isCorrect: true }],
    }

    let submitResult: any
    await act(async () => {
      submitResult = await result.current.actions.submitQuiz(payload)
    })

    expect(mockSubmitQuiz).toHaveBeenCalledWith({
      ...payload,
      slug: "test-quiz",
    })
    expect(mockMarkQuizCompleted).toHaveBeenCalledWith(submitResult)
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/submitQuiz" }))
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/markQuizCompleted" }))
  })

  it("should call saveAnswer with correct parameters", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    act(() => {
      result.current.actions.saveAnswer("q1", "A")
    })

    expect(mockSetUserAnswer).toHaveBeenCalledWith({
      questionId: "q1",
      answer: "A",
    })
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/setUserAnswer" }))
  })

  it("should call navigation functions correctly", () => {
    // Mock state with current question at index 1
    const navigationState = {
      ...mockQuizState,
      currentQuestion: 1,
    }

    mockUseAppSelector.mockImplementation((selector) => {
      if (selector === mockSelectCurrentQuestionData) {
        return mockQuizData.questions[1]
      }
      if (selector === mockSelectQuizProgress) {
        return 33.33
      }
      if (selector === mockSelectIsLastQuestion) {
        return false
      }
      return selector({ quiz: navigationState })
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    // Test next
    act(() => {
      const success = result.current.navigation.next()
      expect(success).toBe(true)
    })
    expect(mockSetCurrentQuestion).toHaveBeenCalledWith(2)
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/setCurrentQuestion" }))

    // Test previous
    mockSetCurrentQuestion.mockClear()
    mockDispatch.mockClear()
    act(() => {
      const success = result.current.navigation.previous()
      expect(success).toBe(true)
    })
    expect(mockSetCurrentQuestion).toHaveBeenCalledWith(0)
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/setCurrentQuestion" }))

    // Test toQuestion
    mockSetCurrentQuestion.mockClear()
    mockDispatch.mockClear()
    act(() => {
      const success = result.current.navigation.toQuestion(2)
      expect(success).toBe(true)
    })
    expect(mockSetCurrentQuestion).toHaveBeenCalledWith(2)
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/setCurrentQuestion" }))

    // Test invalid navigation
    mockSetCurrentQuestion.mockClear()
    mockDispatch.mockClear()
    act(() => {
      const success = result.current.navigation.toQuestion(5) // Out of bounds
      expect(success).toBe(false)
    })
    expect(mockSetCurrentQuestion).not.toHaveBeenCalled()
  })

  it("should prevent race conditions in loadQuiz", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    let resolvePromise: (value: any) => void
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    // Mock fetchQuiz to return a delayed promise
    mockFetchQuiz.mockReturnValueOnce({
      type: "quiz/fetchQuiz",
      unwrap: jest.fn().mockReturnValue(delayedPromise),
    })

    // Start two concurrent requests
    const promise1 = result.current.actions.loadQuiz("test-quiz", "mcq")
    const promise2 = result.current.actions.loadQuiz("test-quiz", "mcq")

    // Resolve the delayed promise
    resolvePromise!({ id: "test-quiz", slug: "test-quiz" })

    const [result1, result2] = await Promise.all([promise1, promise2])

    // Both should return the same result
    expect(result1).toEqual(result2)
    // fetchQuiz should only be called once due to race condition prevention
    expect(mockFetchQuiz).toHaveBeenCalledTimes(1)
  })

  it("should prevent race conditions in submitQuiz", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    let resolvePromise: (value: any) => void
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockSubmitQuiz.mockReturnValueOnce({
      type: "quiz/submitQuiz",
      unwrap: jest.fn().mockReturnValue(delayedPromise),
    })

    const payload = {
      type: "mcq" as const,
      answers: [{ questionId: "q1", answer: "A", isCorrect: true }],
    }

    // Start first submission
    const promise1 = result.current.actions.submitQuiz(payload)

    // Try to start second submission - should throw
    await act(async () => {
      try {
        await result.current.actions.submitQuiz(payload)
        throw new Error("Should have thrown an error")
      } catch (error) {
        expect((error as Error).message).toBe("Quiz submission already in progress")
      }
    })

    // Resolve the first submission
    resolvePromise!({ score: 10 })
    await promise1
  })

  it("should handle temp results correctly", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    const tempResults = { score: 8, totalQuestions: 10 }

    act(() => {
      result.current.actions.setTempResults(tempResults)
    })

    expect(mockSetTempResults).toHaveBeenCalledWith(tempResults)
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/setTempResults" }))

    act(() => {
      result.current.actions.clearTempResults()
    })

    expect(mockClearTempResults).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/clearTempResults" }))
  })

  it("should reset quiz state correctly", () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    act(() => {
      result.current.actions.reset()
    })

    expect(mockResetQuizState).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "quiz/resetQuizState" }))
  })

  it("should create correct quiz instance based on type", () => {
    // Test MCQ quiz
    mockUseAppSelector.mockImplementation((selector) => {
      const state = { quiz: { ...mockQuizState, currentQuizType: "mcq" } }
      return selector(state)
    })

    const mcqWrapper = createWrapper()
    const { result: mcqResult } = renderHook(() => useQuiz(), { wrapper: mcqWrapper })
    expect(mockMCQQuiz).toHaveBeenCalled()

    // Clear mocks and test Code quiz
    jest.clearAllMocks()
    mockUseAppSelector.mockImplementation((selector) => {
      const state = { quiz: { ...mockQuizState, currentQuizType: "code" } }
      return selector(state)
    })

    const codeWrapper = createWrapper()
    const { result: codeResult } = renderHook(() => useQuiz(), { wrapper: codeWrapper })
    expect(mockCodeQuiz).toHaveBeenCalled()

    // Clear mocks and test Blanks quiz
    jest.clearAllMocks()
    mockUseAppSelector.mockImplementation((selector) => {
      const state = { quiz: { ...mockQuizState, currentQuizType: "blanks" } }
      return selector(state)
    })

    const blanksWrapper = createWrapper()
    const { result: blanksResult } = renderHook(() => useQuiz(), { wrapper: blanksWrapper })
    expect(mockBlanksQuiz).toHaveBeenCalled()
  })

  it("should handle edge cases in navigation", () => {
    // Test navigation at boundaries
    const edgeState = {
      ...mockQuizState,
      currentQuestion: 0, // At the beginning
    }

    mockUseAppSelector.mockImplementation((selector) => {
      return selector({ quiz: edgeState })
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    // Test previous at beginning - should return false
    act(() => {
      const success = result.current.navigation.previous()
      expect(success).toBe(false)
    })
    expect(mockSetCurrentQuestion).not.toHaveBeenCalled()

    // Test navigation to last question
    mockSetCurrentQuestion.mockClear()
    const lastQuestionState = {
      ...mockQuizState,
      currentQuestion: 2, // At the end (questions.length - 1)
    }

    mockUseAppSelector.mockImplementation((selector) => {
      return selector({ quiz: lastQuestionState })
    })

    const { result: lastResult } = renderHook(() => useQuiz(), { wrapper })

    // Test next at end - should return false
    act(() => {
      const success = lastResult.current.navigation.next()
      expect(success).toBe(false)
    })
    expect(mockSetCurrentQuestion).not.toHaveBeenCalled()
  })

  it("should handle errors in async operations", async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useQuiz(), { wrapper })

    // Test loadQuiz error handling
    mockFetchQuiz.mockReturnValueOnce({
      type: "quiz/fetchQuiz",
      unwrap: jest.fn().mockRejectedValue(new Error("Network error")),
    })

    await act(async () => {
      try {
        await result.current.actions.loadQuiz("test-quiz", "mcq")
      } catch (error) {
        expect((error as Error).message).toBe("Network error")
      }
    })

    // Test submitQuiz error handling
    mockSubmitQuiz.mockReturnValueOnce({
      type: "quiz/submitQuiz",
      unwrap: jest.fn().mockRejectedValue(new Error("Submission failed")),
    })

    await act(async () => {
      try {
        await result.current.actions.submitQuiz({
          type: "mcq",
          answers: [{ questionId: "q1", answer: "A", isCorrect: true }],
        })
      } catch (error) {
        expect((error as Error).message).toBe("Submission failed")
      }
    })
  })
})
