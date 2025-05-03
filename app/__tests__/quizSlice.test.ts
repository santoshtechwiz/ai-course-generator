import quizReducer, {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setIsAuthenticated,
  setRequiresAuth,
  setPendingAuthRequired,
  setHasGuestResult,
  clearGuestResults,
} from "@/store/slices/quizSlice"

describe("quizSlice", () => {
  const initialState = {
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
    pendingAuthRequired: false,
    isAuthenticated: false,
    hasGuestResult: false,
    guestResultsSaved: false,
    authCheckComplete: false,
    isProcessingAuth: false,
    error: null,
    animationState: "idle",
    isSavingResults: false,
    completedAt: null,
  }

  const mockQuestions = [
    {
      id: "1",
      question: "What is the capital of France?",
      answer: "Paris",
      option1: "London",
      option2: "Berlin",
      option3: "Madrid",
    },
    {
      id: "2",
      question: "What is 2 + 2?",
      answer: "4",
      option1: "3",
      option2: "5",
      option3: "6",
    },
  ]

  test("should return the initial state", () => {
    expect(quizReducer(undefined, { type: undefined })).toEqual(initialState)
  })

  test("should handle initQuiz", () => {
    const quizData = {
      id: "test-quiz",
      slug: "test-quiz",
      title: "Test Quiz",
      quizType: "mcq",
      questions: mockQuestions,
      isAuthenticated: true,
    }

    const nextState = quizReducer(initialState, initQuiz(quizData))

    expect(nextState.quizId).toBe("test-quiz")
    expect(nextState.slug).toBe("test-quiz")
    expect(nextState.title).toBe("Test Quiz")
    expect(nextState.quizType).toBe("mcq")
    expect(nextState.questions).toEqual(mockQuestions)
    expect(nextState.isAuthenticated).toBe(true)
    expect(nextState.currentQuestionIndex).toBe(0)
    expect(nextState.answers).toEqual([])
    expect(nextState.timeSpent).toEqual([])
    expect(nextState.isCompleted).toBe(false)
    expect(nextState.score).toBe(0)
  })

  test("should handle submitAnswer", () => {
    const answer = {
      answer: "Paris",
      userAnswer: "Paris",
      isCorrect: true,
      timeSpent: 10,
      questionId: "1",
    }

    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 0,
    }

    const nextState = quizReducer(state, submitAnswer(answer))

    expect(nextState.answers[0]).toEqual(answer)
    expect(nextState.timeSpent[0]).toBe(10)
    expect(nextState.animationState).toBe("answering")
  })

  test("should handle nextQuestion", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 0,
    }

    const nextState = quizReducer(state, nextQuestion())

    expect(nextState.currentQuestionIndex).toBe(1)
    expect(nextState.animationState).toBe("idle")
  })

  test("should not increment currentQuestionIndex beyond questions length", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 1, // Last question
    }

    const nextState = quizReducer(state, nextQuestion())

    expect(nextState.currentQuestionIndex).toBe(1) // Should not change
  })

  test("should handle completeQuiz with provided score", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      answers: [
        { answer: "Paris", userAnswer: "Paris", isCorrect: true, timeSpent: 10 },
        { answer: "4", userAnswer: "4", isCorrect: true, timeSpent: 5 },
      ],
    }

    const completedAt = new Date().toISOString()
    const nextState = quizReducer(
      state,
      completeQuiz({
        score: 100,
        completedAt,
      }),
    )

    expect(nextState.isCompleted).toBe(true)
    expect(nextState.score).toBe(100)
    expect(nextState.completedAt).toBe(completedAt)
    expect(nextState.animationState).toBe("completed")
  })

  test("should handle completeQuiz with calculated score", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      answers: [
        { answer: "Paris", userAnswer: "Paris", isCorrect: true, timeSpent: 10 },
        { answer: "4", userAnswer: "3", isCorrect: false, timeSpent: 5 },
      ],
    }

    const nextState = quizReducer(state, completeQuiz())

    expect(nextState.isCompleted).toBe(true)
    expect(nextState.score).toBe(50) // 1 out of 2 correct = 50%
    expect(nextState.completedAt).toBeTruthy()
    expect(nextState.animationState).toBe("completed")
  })

  test("should handle resetQuiz", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 1,
      answers: [{ answer: "Paris", userAnswer: "Paris", isCorrect: true, timeSpent: 10 }],
      timeSpent: [10],
      isCompleted: true,
      score: 100,
      completedAt: new Date().toISOString(),
      animationState: "completed",
    }

    const nextState = quizReducer(state, resetQuiz())

    expect(nextState.currentQuestionIndex).toBe(0)
    expect(nextState.answers).toEqual(Array(mockQuestions.length).fill(null))
    expect(nextState.timeSpent).toEqual(Array(mockQuestions.length).fill(0))
    expect(nextState.isCompleted).toBe(false)
    expect(nextState.score).toBe(0)
    expect(nextState.completedAt).toBeNull()
    expect(nextState.animationState).toBe("idle")
  })

  test("should handle setIsAuthenticated", () => {
    const nextState = quizReducer(initialState, setIsAuthenticated(true))
    expect(nextState.isAuthenticated).toBe(true)
  })

  test("should handle setRequiresAuth", () => {
    const nextState = quizReducer(initialState, setRequiresAuth(true))
    expect(nextState.requiresAuth).toBe(true)
  })

  test("should handle setPendingAuthRequired", () => {
    const nextState = quizReducer(initialState, setPendingAuthRequired(true))
    expect(nextState.pendingAuthRequired).toBe(true)
  })

  test("should handle setHasGuestResult", () => {
    const nextState = quizReducer(initialState, setHasGuestResult(true))
    expect(nextState.hasGuestResult).toBe(true)
    expect(nextState.guestResultsSaved).toBe(true)
  })

  test("should handle clearGuestResults", () => {
    const state = {
      ...initialState,
      hasGuestResult: true,
      guestResultsSaved: true,
    }

    const nextState = quizReducer(state, clearGuestResults())
    expect(nextState.hasGuestResult).toBe(false)
    expect(nextState.guestResultsSaved).toBe(false)
  })
})
