import {
  determineDisplayState,
  calculateQuizScore,
  calculateTotalTime,
  validateInitialQuizData,
  createSafeQuizData,
} from "@/lib/utils/quiz-state-utils"

describe("Quiz State Utilities", () => {
  // Mock quiz state for testing
  const mockQuizState = {
    currentQuestionIndex: 0,
    isLoading: false,
    isLoadingResults: false,
    isSavingResults: false,
    isCompleted: false,
    isProcessingAuth: false,
    requiresAuth: false,
  }

  describe("determineDisplayState", () => {
    it("should return 'preparing' when processing auth", () => {
      const state = { ...mockQuizState, isProcessingAuth: true }
      expect(determineDisplayState(state, true, false)).toBe("preparing")
    })

    it("should return 'preparing' when returning from auth", () => {
      expect(determineDisplayState(mockQuizState, true, true)).toBe("preparing")
    })

    it("should return 'loading' when loading quiz", () => {
      const state = { ...mockQuizState, isLoading: true }
      expect(determineDisplayState(state, true, false)).toBe("loading")
    })

    it("should return 'loading' when loading results", () => {
      const state = { ...mockQuizState, isLoadingResults: true }
      expect(determineDisplayState(state, true, false)).toBe("loading")
    })

    it("should return 'saving' when saving results", () => {
      const state = { ...mockQuizState, isSavingResults: true }
      expect(determineDisplayState(state, true, false)).toBe("saving")
    })

    it("should return 'results' when completed and authenticated", () => {
      const state = { ...mockQuizState, isCompleted: true }
      expect(determineDisplayState(state, true, false)).toBe("results")
    })

    it("should return 'auth' when completed and not authenticated", () => {
      const state = { ...mockQuizState, isCompleted: true, requiresAuth: true }
      expect(determineDisplayState(state, false, false)).toBe("auth")
    })

    it("should return 'quiz' by default", () => {
      expect(determineDisplayState(mockQuizState, true, false)).toBe("quiz")
    })
  })

  describe("calculateQuizScore", () => {
    it("should calculate score correctly", () => {
      const answers = [{ isCorrect: true }, { isCorrect: false }, { isCorrect: true }, { isCorrect: true }]
      expect(calculateQuizScore(answers, 4)).toBe(75) // 3 out of 4 = 75%
    })

    it("should handle empty answers", () => {
      expect(calculateQuizScore([], 0)).toBe(0)
    })

    it("should handle all correct answers", () => {
      const answers = [{ isCorrect: true }, { isCorrect: true }]
      expect(calculateQuizScore(answers, 2)).toBe(100) // 2 out of 2 = 100%
    })

    it("should handle all incorrect answers", () => {
      const answers = [{ isCorrect: false }, { isCorrect: false }]
      expect(calculateQuizScore(answers, 2)).toBe(0) // 0 out of 2 = 0%
    })
  })

  describe("calculateTotalTime", () => {
    it("should calculate total time correctly", () => {
      const answers = [{ timeSpent: 10 }, { timeSpent: 15 }, { timeSpent: 20 }]
      expect(calculateTotalTime(answers)).toBe(45) // 10 + 15 + 20 = 45
    })

    it("should handle empty answers", () => {
      expect(calculateTotalTime([])).toBe(0)
    })

    it("should handle missing timeSpent", () => {
      const answers = [{ timeSpent: 10 }, {}, { timeSpent: 20 }]
      expect(calculateTotalTime(answers)).toBe(30) // 10 + 0 + 20 = 30
    })
  })

  describe("validateInitialQuizData", () => {
    it("should validate valid quiz data", () => {
      const quizData = {
        id: "test-id",
        title: "Test Quiz",
        questions: [{ id: "q1", question: "Test Question" }],
      }
      expect(validateInitialQuizData(quizData)).toEqual({ isValid: true })
    })

    it("should reject missing quiz data", () => {
      expect(validateInitialQuizData(null)).toEqual({
        isValid: false,
        error: "Quiz data is missing",
      })
    })

    it("should reject missing questions", () => {
      const quizData = {
        id: "test-id",
        title: "Test Quiz",
      }
      expect(validateInitialQuizData(quizData)).toEqual({
        isValid: false,
        error: "Quiz questions are missing or invalid",
      })
    })

    it("should reject empty questions array", () => {
      const quizData = {
        id: "test-id",
        title: "Test Quiz",
        questions: [],
      }
      expect(validateInitialQuizData(quizData)).toEqual({
        isValid: false,
        error: "Quiz questions are missing or invalid",
      })
    })
  })

  describe("createSafeQuizData", () => {
    it("should create safe quiz data with defaults", () => {
      const result = createSafeQuizData(null, "test-slug", "mcq")
      expect(result).toEqual({
        id: "unknown",
        quizId: "unknown",
        title: "Quiz",
        description: "",
        quizType: "mcq",
        slug: "test-slug",
        difficulty: "medium",
        isPublic: false,
        isFavorite: false,
        userId: "",
        questions: [],
      })
    })

    it("should preserve existing data", () => {
      const quizData = {
        id: "test-id",
        title: "Test Quiz",
        description: "Test Description",
        difficulty: "hard",
        isPublic: true,
        isFavorite: true,
        userId: "user-123",
        questions: [{ id: "q1", question: "Test Question" }],
      }
      const result = createSafeQuizData(quizData, "test-slug", "mcq")
      expect(result).toEqual({
        id: "test-id",
        quizId: "test-id",
        title: "Test Quiz",
        description: "Test Description",
        quizType: "mcq",
        slug: "test-slug",
        difficulty: "hard",
        isPublic: true,
        isFavorite: true,
        userId: "user-123",
        questions: [{ id: "q1", question: "Test Question" }],
      })
    })

    it("should handle quizId vs id", () => {
      const quizData = {
        quizId: "test-id",
        title: "Test Quiz",
      }
      const result = createSafeQuizData(quizData, "test-slug", "mcq")
      expect(result.id).toBe("test-id")
      expect(result.quizId).toBe("test-id")
    })
  })
})
