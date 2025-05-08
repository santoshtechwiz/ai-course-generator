import quizReducer, {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  setRequiresAuth,
  setPendingAuthRequired,

} from "@/store/slices/quizSlice"

// Define initial state for tests
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
  hasNonAuthenticatedUserResult: false,
  nonAuthenticatedUserResultsSaved: false,
  authCheckComplete: false,
  error: null,
  animationState: "idle",
  isSavingResults: false,
  resultsSaved: false,
  completedAt: null,
  startTime: expect.any(Number),
  savedState: null,
  isProcessingAuth: false,
  redirectUrl: null,
}

// Mock data
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

describe("quizSlice", () => {
  test("should return the initial state", () => {
    expect(quizReducer(undefined, { type: undefined })).toEqual(initialState)
  })

  test("should handle initQuiz", () => {
    const nextState = quizReducer(
      initialState,
      initQuiz({
        id: "test-quiz",
        slug: "test-quiz",
        title: "Test Quiz",
        quizType: "mcq",
        questions: mockQuestions,
        isAuthenticated: true,
      }),
    )

    expect(nextState.quizId).toBe("test-quiz")
    expect(nextState.slug).toBe("test-quiz")
    expect(nextState.title).toBe("Test Quiz")
    expect(nextState.quizType).toBe("mcq")
    expect(nextState.questions).toEqual(mockQuestions)
    expect(nextState.currentQuestionIndex).toBe(0)
    // Expect arrays with null values for new quiz
    expect(nextState.answers).toEqual(Array(mockQuestions.length).fill(null))
    expect(nextState.timeSpent).toEqual(Array(mockQuestions.length).fill(0))
    expect(nextState.isCompleted).toBe(false)
    expect(nextState.score).toBe(0)
  })

  test("should handle submitAnswer", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      answers: [null, null],
      timeSpent: [0, 0],
    }

    const nextState = quizReducer(
      state,
      submitAnswer({
        answer: "Paris",
        isCorrect: true,
        timeSpent: 10,
        questionId: "1",
      }),
    )

    expect(nextState.answers[0]).toEqual({
      answer: "Paris",
      userAnswer: "Paris",
      isCorrect: true,
      timeSpent: 10,
      questionId: "1",
    })
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

    expect(nextState.currentQuestionIndex).toBe(1) // Should not increment
  })

  test("should handle completeQuiz with provided score", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      answers: [
        { answer: "Paris", isCorrect: true, timeSpent: 10 },
        { answer: "4", isCorrect: true, timeSpent: 5 },
      ],
    }

    const nextState = quizReducer(
      state,
      completeQuiz({
        score: 85,
        completedAt: "2023-01-01T00:00:00.000Z",
      }),
    )

    expect(nextState.isCompleted).toBe(true)
    expect(nextState.score).toBe(85)
    expect(nextState.completedAt).toBe("2023-01-01T00:00:00.000Z")
    expect(nextState.animationState).toBe("completed")
  })

  test("should handle completeQuiz with calculated score", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      answers: [
        { answer: "Paris", isCorrect: true, timeSpent: 10 },
        { answer: "4", isCorrect: true, timeSpent: 5 },
      ],
    }

    const nextState = quizReducer(state, completeQuiz())

    expect(nextState.isCompleted).toBe(true)
    expect(nextState.score).toBe(100) // 2/2 correct = 100%
    expect(nextState.completedAt).toBeTruthy()
    expect(nextState.animationState).toBe("completed")
  })

  test("should handle resetQuiz", () => {
    const state = {
      ...initialState,
      questions: mockQuestions,
      currentQuestionIndex: 1,
      answers: [
        { answer: "Paris", isCorrect: true, timeSpent: 10 },
        { answer: "4", isCorrect: true, timeSpent: 5 },
      ],
      timeSpent: [10, 5],
      isCompleted: true,
      score: 100,
      completedAt: "2023-01-01T00:00:00.000Z",
      animationState: "completed",
      error: "Some error",
      resultsSaved: true,
    }

    const nextState = quizReducer(state, resetQuiz())

    expect(nextState.currentQuestionIndex).toBe(0)
    expect(nextState.answers).toEqual([])
    expect(nextState.timeSpent).toEqual([])
    expect(nextState.isCompleted).toBe(false)
    expect(nextState.score).toBe(0)
    expect(nextState.completedAt).toBeNull()
    expect(nextState.animationState).toBe("idle")
    expect(nextState.error).toBeNull()
    expect(nextState.resultsSaved).toBe(false)
    expect(nextState.questions).toEqual(mockQuestions) // Questions should be preserved
  })

  test("should handle setRequiresAuth", () => {
    const nextState = quizReducer(initialState, setRequiresAuth(true))
    expect(nextState.requiresAuth).toBe(true)
  })

  test("should handle setPendingAuthRequired", () => {
    const nextState = quizReducer(initialState, setPendingAuthRequired(true))
    expect(nextState.pendingAuthRequired).toBe(true)
  })


})
