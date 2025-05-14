
import type { QuizQuestion } from "@/app/types/quiz-types"
import { areAllRequiredQuestionsAnswered, calculateEstimatedTime, calculatePercentage, calculateStringSimilarity, capitalizeFirstLetter, debounce, evaluateCode, evaluateOpenEndedAnswer, formatDate, formatDuration, formatTime, generateFeedback, generateId, getDifficultyColor, isPassed, shuffleArray, truncateString } from "@/lib/utils/quiz-utils"

describe("Quiz Utilities", () => {
  describe("formatTime", () => {
    test("formats seconds correctly", () => {
      expect(formatTime(65)).toBe("01:05")
      expect(formatTime(3600)).toBe("60:00")
      expect(formatTime(0)).toBe("00:00")
    })

    test("handles null or undefined", () => {
      expect(formatTime(null)).toBe("--:--")
      expect(formatTime(undefined as any)).toBe("--:--")
    })
  })

  describe("formatDuration", () => {
    test("formats duration correctly", () => {
      expect(formatDuration(3665)).toBe("1h 1m")
      expect(formatDuration(3600)).toBe("1h")
      expect(formatDuration(60)).toBe("1m")
      expect(formatDuration(0)).toBe("0m")
    })
  })

  describe("formatDate", () => {
    test("formats date correctly", () => {
      const date = new Date("2023-01-15")
      expect(formatDate(date)).toBe("Jan 15, 2023")
      expect(formatDate("2023-01-15")).toBe("Jan 15, 2023")
    })

    test("handles empty input", () => {
      expect(formatDate("")).toBe("")
    })
  })

  describe("truncateString", () => {
    test("truncates string correctly", () => {
      expect(truncateString("Hello World", 5)).toBe("Hello...")
      expect(truncateString("Hello", 10)).toBe("Hello")
      expect(truncateString("", 5)).toBe("")
    })
  })

  describe("calculatePercentage", () => {
    test("calculates percentage correctly", () => {
      expect(calculatePercentage(75, 100)).toBe(75)
      expect(calculatePercentage(3, 4)).toBe(75)
      expect(calculatePercentage(0, 100)).toBe(0)
    })

    test("handles zero or negative maxScore", () => {
      expect(calculatePercentage(10, 0)).toBe(0)
      expect(calculatePercentage(10, -5)).toBe(0)
    })
  })

  describe("isPassed", () => {
    test("determines if score passes threshold", () => {
      expect(isPassed(75)).toBe(true)
      expect(isPassed(70)).toBe(true)
      expect(isPassed(69)).toBe(false)
    })

    test("works with custom threshold", () => {
      expect(isPassed(65, 60)).toBe(true)
      expect(isPassed(59, 60)).toBe(false)
    })
  })

  describe("generateFeedback", () => {
    test("generates appropriate feedback based on percentage", () => {
      expect(generateFeedback(95)).toBe("Excellent work! You've mastered this topic.")
      expect(generateFeedback(85)).toBe("Great job! You have a strong understanding of this topic.")
      expect(generateFeedback(75)).toBe("Good work! You've passed the quiz with a solid score.")
      expect(generateFeedback(65)).toBe("You're on the right track, but there's room for improvement.")
      expect(generateFeedback(55)).toBe("You might need to review this topic more thoroughly.")
    })
  })

  describe("calculateStringSimilarity", () => {
    test("calculates string similarity correctly", () => {
      expect(calculateStringSimilarity("hello", "hello")).toBe(1)
      expect(calculateStringSimilarity("hello", "helo")).toBe(0.8)
      expect(calculateStringSimilarity("hello", "world")).toBeLessThan(0.5)
    })

    test("handles empty strings", () => {
      expect(calculateStringSimilarity("", "")).toBe(1)
      expect(calculateStringSimilarity("hello", "")).toBe(0)
      expect(calculateStringSimilarity("", "hello")).toBe(0)
    })

    test("is case insensitive", () => {
      expect(calculateStringSimilarity("Hello", "hello")).toBe(1)
      expect(calculateStringSimilarity("WORLD", "world")).toBe(1)
    })
  })

  describe("evaluateOpenEndedAnswer", () => {
    test("evaluates open-ended answers based on keywords", () => {
      expect(evaluateOpenEndedAnswer("React is a JavaScript library", ["react", "javascript"])).toBe(1)
      expect(evaluateOpenEndedAnswer("React is a framework", ["react", "javascript"])).toBe(0.5)
      expect(evaluateOpenEndedAnswer("It's a tool", ["react", "javascript"])).toBe(0)
    })

    test("handles empty inputs", () => {
      expect(evaluateOpenEndedAnswer("", ["keyword"])).toBe(0)
      expect(evaluateOpenEndedAnswer("answer", [])).toBe(0)
    })

    test("matches similar words", () => {
      expect(evaluateOpenEndedAnswer("The reactjs library", ["react"], 0.7)).toBe(1)
    })
  })

  describe("evaluateCode", () => {
    test("evaluates code against test cases", () => {
      const testCases = [
        { id: "1", input: "test1", expectedOutput: "result1" },
        { id: "2", input: "test2", expectedOutput: "result2" },
        { id: "3", input: "test3", expectedOutput: "result3" },
      ]

      const result = evaluateCode("function test() { return true; }", testCases)

      expect(result.total).toBe(3)
      expect(result.passed).toBe(2) // Mock implementation returns 70% passing
      expect(result.percentage).toBeCloseTo(66.67, 1)
      expect(result.feedback).toBe("Your solution works for some test cases, but needs improvement.")
    })

    test("handles empty test cases", () => {
      const result = evaluateCode("function test() {}", [])

      expect(result.total).toBe(0)
      expect(result.passed).toBe(0)
      expect(result.percentage).toBe(0)
      expect(result.feedback).toBe("Your solution needs significant improvement. Review the test cases and try again.")
    })
  })

  describe("getDifficultyColor", () => {
    test("returns correct color classes for different difficulty levels", () => {
      expect(getDifficultyColor("easy")).toBe("bg-green-100 text-green-800 border-green-200")
      expect(getDifficultyColor("medium")).toBe("bg-yellow-100 text-yellow-800 border-yellow-200")
      expect(getDifficultyColor("hard")).toBe("bg-red-100 text-red-800 border-red-200")
      expect(getDifficultyColor("expert")).toBe("bg-purple-100 text-purple-800 border-purple-200")
    })

    test("handles unknown difficulty and undefined", () => {
      expect(getDifficultyColor("unknown")).toBe("bg-blue-100 text-blue-800 border-blue-200")
      expect(getDifficultyColor(undefined)).toBe("bg-blue-100 text-blue-800 border-blue-200")
    })

    test("is case insensitive", () => {
      expect(getDifficultyColor("EASY")).toBe("bg-green-100 text-green-800 border-green-200")
      expect(getDifficultyColor("Medium")).toBe("bg-yellow-100 text-yellow-800 border-yellow-200")
    })
  })

  describe("calculateEstimatedTime", () => {
    test("calculates estimated time based on question types", () => {
      const questions: QuizQuestion[] = [
        { id: "1", type: "mcq", question: "Q1" } as QuizQuestion,
        { id: "2", type: "code", question: "Q2" } as QuizQuestion,
        { id: "3", type: "blanks", question: "Q3" } as QuizQuestion,
        { id: "4", type: "openended", question: "Q4" } as QuizQuestion,
      ]

      expect(calculateEstimatedTime(questions)).toBe(11) // 1 + 5 + 2 + 3
    })

    test("handles empty questions array", () => {
      expect(calculateEstimatedTime([])).toBe(0)
    })

    test("handles unknown question types", () => {
      const questions: QuizQuestion[] = [{ id: "1", type: "unknown" as any, question: "Q1" } as QuizQuestion]

      expect(calculateEstimatedTime(questions)).toBe(2) // Default time
    })
  })

  describe("areAllRequiredQuestionsAnswered", () => {
    test("checks if all required questions are answered", () => {
      const questions: QuizQuestion[] = [
        { id: "q1", type: "mcq", question: "Q1", required: true } as QuizQuestion,
        { id: "q2", type: "mcq", question: "Q2", required: true } as QuizQuestion,
      ]

      const userAnswers = {
        q1: "answer1",
        q2: "answer2",
      }

      expect(areAllRequiredQuestionsAnswered(questions, userAnswers)).toBe(true)
    })

    test("detects missing answers", () => {
      const questions: QuizQuestion[] = [
        { id: "q1", type: "mcq", question: "Q1", required: true } as QuizQuestion,
        { id: "q2", type: "mcq", question: "Q2", required: true } as QuizQuestion,
      ]

      const userAnswers = {
        q1: "answer1",
      }

      expect(areAllRequiredQuestionsAnswered(questions, userAnswers)).toBe(false)
    })

    test("skips optional questions", () => {
      const questions: QuizQuestion[] = [
        { id: "q1", type: "mcq", question: "Q1", required: true } as QuizQuestion,
        { id: "q2", type: "mcq", question: "Q2", optional: true } as QuizQuestion,
      ]

      const userAnswers = {
        q1: "answer1",
      }

      expect(areAllRequiredQuestionsAnswered(questions, userAnswers)).toBe(true)
    })

    test("validates fill-in-the-blanks answers", () => {
      const questions: QuizQuestion[] = [{ id: "q1", type: "blanks", question: "Q1", required: true } as QuizQuestion]

      // All blanks filled
      expect(areAllRequiredQuestionsAnswered(questions, { q1: { blank1: "answer1", blank2: "answer2" } })).toBe(true)

      // Missing blank
      expect(areAllRequiredQuestionsAnswered(questions, { q1: { blank1: "answer1", blank2: "" } })).toBe(false)

      // Wrong answer type
      expect(areAllRequiredQuestionsAnswered(questions, { q1: "not an object" })).toBe(false)
    })

    test("validates open-ended answers with minimum length", () => {
      const questions: QuizQuestion[] = [
        { id: "q1", type: "openended", question: "Q1", required: true, minLength: 10 } as QuizQuestion,
      ]

      // Answer meets minimum length
      expect(areAllRequiredQuestionsAnswered(questions, { q1: "This is a long enough answer" })).toBe(true)

      // Answer too short
      expect(areAllRequiredQuestionsAnswered(questions, { q1: "Too short" })).toBe(false)
    })
  })

  describe("generateId", () => {
    test("generates unique IDs", () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe("string")
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe("shuffleArray", () => {
    test("shuffles array elements", () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)

      // Same elements
      expect(shuffled.sort()).toEqual(original.sort())

      // Original array not modified
      expect(original).toEqual([1, 2, 3, 4, 5])
    })

    test("handles empty arrays", () => {
      expect(shuffleArray([])).toEqual([])
    })
  })

  describe("capitalizeFirstLetter", () => {
    test("capitalizes first letter", () => {
      expect(capitalizeFirstLetter("hello")).toBe("Hello")
      expect(capitalizeFirstLetter("world")).toBe("World")
      expect(capitalizeFirstLetter("Hello")).toBe("Hello")
    })

    test("handles empty strings", () => {
      expect(capitalizeFirstLetter("")).toBe("")
    })
  })

  describe("debounce", () => {
    test("debounces function calls", () => {
      jest.useFakeTimers()

      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Call multiple times
      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Function not called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      jest.advanceTimersByTime(100)

      // Function called once
      expect(mockFn).toHaveBeenCalledTimes(1)

      jest.useRealTimers()
    })
  })
})
