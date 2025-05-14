import type { QuizQuestion, TestCase } from "@/app/types/quiz-types"

/**
 * Formats time in seconds to a MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  return parts.join(" ")
}

/**
 * Formats a date to a human-readable string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return ""

  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Truncates a string to a specified length
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, length: number): string {
  if (!str) return ""
  if (str.length <= length) return str

  return str.slice(0, length) + "..."
}

/**
 * Calculates the percentage score
 * @param score - The achieved score
 * @param maxScore - The maximum possible score
 * @returns Percentage score (0-100)
 */
export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0
  return Math.round((score / maxScore) * 100)
}

/**
 * Determines if a quiz is passed based on the percentage score
 * @param percentage - The percentage score
 * @param passingThreshold - The passing threshold (default: 70)
 * @returns Boolean indicating if the quiz is passed
 */
export function isPassed(percentage: number, passingThreshold = 70): boolean {
  return percentage >= passingThreshold
}

/**
 * Generates feedback based on the percentage score
 * @param percentage - The percentage score
 * @returns Feedback message
 */
export function generateFeedback(percentage: number): string {
  if (percentage >= 90) {
    return "Excellent work! You've mastered this topic."
  } else if (percentage >= 80) {
    return "Great job! You have a strong understanding of this topic."
  } else if (percentage >= 70) {
    return "Good work! You've passed the quiz with a solid score."
  } else if (percentage >= 60) {
    return "You're on the right track, but there's room for improvement."
  } else {
    return "You might need to review this topic more thoroughly."
  }
}

/**
 * Calculates the similarity between two strings
 * Uses Levenshtein distance algorithm
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1
  if (!str1 || !str2) return 0

  // Convert to lowercase for case-insensitive comparison
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  // Calculate Levenshtein distance
  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null))

  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i
  }

  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j
  }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      )
    }
  }

  // Calculate similarity as 1 - normalized distance
  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) return 1

  return 1 - track[s2.length][s1.length] / maxLength
}

/**
 * Evaluates an open-ended answer based on keyword matching
 * @param answer - The user's answer
 * @param keywords - Array of keywords that should be present
 * @param minSimilarity - Minimum similarity threshold for partial matches (default: 0.8)
 * @returns Score between 0 and 1
 */
export function evaluateOpenEndedAnswer(answer: string, keywords: string[], minSimilarity = 0.8): number {
  if (!answer || !keywords.length) return 0

  const answerLower = answer.toLowerCase()
  let matchedKeywords = 0

  for (const keyword of keywords) {
    // Check for exact match
    if (answerLower.includes(keyword.toLowerCase())) {
      matchedKeywords++
      continue
    }

    // Check for similar matches
    const words = answerLower.split(/\s+/)
    for (const word of words) {
      if (word.length > 3 && calculateStringSimilarity(word, keyword) >= minSimilarity) {
        matchedKeywords++
        break
      }
    }
  }

  return keywords.length > 0 ? matchedKeywords / keywords.length : 0
}

/**
 * Evaluates code against test cases
 * @param code - The user's code
 * @param testCases - Array of test cases
 * @returns Object containing evaluation results
 */
export function evaluateCode(
  code: string,
  testCases: TestCase[],
): {
  passed: number
  total: number
  percentage: number
  feedback: string
} {
  // This is a mock implementation
  // In a real application, this would execute the code against test cases

  // For testing purposes, we'll simulate some test cases passing
  const passedCount = Math.floor(testCases.length * 0.7)
  const percentage = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100 * 100) / 100 : 0

  let feedback = ""
  if (percentage >= 90) {
    feedback = "Excellent work! Your solution is very efficient."
  } else if (percentage >= 70) {
    feedback = "Good job! Your solution works for most test cases."
  } else if (percentage >= 50) {
    feedback = "Your solution works for some test cases, but needs improvement."
  } else {
    feedback = "Your solution needs significant improvement. Review the test cases and try again."
  }

  return {
    passed: passedCount,
    total: testCases.length,
    percentage,
    feedback,
  }
}

/**
 * Gets the difficulty level color for UI display
 * @param difficulty - The difficulty level
 * @returns CSS class string for the difficulty
 */
export function getDifficultyColor(difficulty?: string): string {
  if (!difficulty) return "bg-blue-100 text-blue-800 border-blue-200"

  const colorMap: Record<string, string> = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-red-100 text-red-800 border-red-200",
    expert: "bg-purple-100 text-purple-800 border-purple-200",
  }

  return colorMap[difficulty.toLowerCase()] || "bg-blue-100 text-blue-800 border-blue-200"
}

/**
 * Calculates the estimated time to complete a quiz
 * @param questions - Array of quiz questions
 * @returns Estimated time in minutes
 */
export function calculateEstimatedTime(questions: QuizQuestion[]): number {
  if (!questions.length) return 0

  let totalTime = 0

  for (const question of questions) {
    switch (question.type) {
      case "mcq":
        totalTime += 1 // 1 minute per MCQ
        break
      case "code":
        totalTime += 5 // 5 minutes per coding question
        break
      case "blanks":
        totalTime += 2 // 2 minutes per fill-in-the-blanks
        break
      case "openended":
        totalTime += 3 // 3 minutes per open-ended question
        break
      default:
        totalTime += 2 // Default time
    }
  }

  return totalTime
}

/**
 * Checks if all required questions are answered
 * @param questions - Array of quiz questions
 * @param userAnswers - Object mapping question IDs to user answers
 * @returns Boolean indicating if all required questions are answered
 */
export function areAllRequiredQuestionsAnswered(questions: QuizQuestion[], userAnswers: Record<string, any>): boolean {
  for (const question of questions) {
    // Skip optional questions
    if (question.optional) continue

    const answer = userAnswers[question.id]

    // Check if answer exists
    if (!answer) return false

    // Check specific question types
    switch (question.type) {
      case "blanks":
        // For fill-in-the-blanks, check if all blanks are filled
        if (typeof answer === "object") {
          const blanks = Object.keys(answer)
          if (!blanks.length) return false

          for (const blank of blanks) {
            if (!answer[blank]) return false
          }
        } else {
          return false
        }
        break

      case "openended":
        // For open-ended, check minimum length
        if (typeof answer === "string" && question.minLength) {
          if (answer.length < question.minLength) return false
        }
        break

      default:
        // For other types, just check if answer exists
        if (!answer) return false
    }
  }

  return true
}

/**
 * Generates a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Debounces a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
