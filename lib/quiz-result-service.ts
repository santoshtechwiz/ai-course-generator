import type { QuizType } from "@/app/types/types"

interface QuizAnswer {
  answer: string | string[]
  isCorrect?: boolean
  timeSpent: number
  similarity?: number
  hintsUsed?: boolean
}

interface QuizSubmission {
  quizId: string
  slug: string
  answers: QuizAnswer[]
  totalTime: number
  score: number
  type: QuizType
  totalQuestions: number
}

export async function submitQuizResult(submission: QuizSubmission): Promise<any> {
  console.log("Submitting quiz result:", submission)

  try {
    // Format the answers based on quiz type
    let formattedAnswers = submission.answers

    // For fill-in-the-blanks quizzes, we need to format the answers differently
    if (submission.type === "fill-blanks") {
      formattedAnswers = submission.answers.map((answer) => ({
        answer: answer.answer,
        userAnswer: answer.answer,
        timeSpent: answer.timeSpent,
        hintsUsed: answer.hintsUsed || false,
      }))
    }

    // For open-ended quizzes, we need to format the answers differently
    if (submission.type === "openended") {
      formattedAnswers = submission.answers.map((answer) => ({
        answer: answer.answer,
        timeSpent: answer.timeSpent,
        hintsUsed: answer.hintsUsed || false,
      }))
    }

    // Prepare the request payload
    const payload = {
      quizId: submission.quizId,
      answers: formattedAnswers,
      totalTime: submission.totalTime,
      score: submission.score,
      type: submission.type,
    }

    console.log("Sending API request to save quiz result:", payload)

    // Make the API call to save the quiz result
    const response = await fetch(`/api/quiz/${submission.slug}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error response from API:", errorData)
      throw new Error(errorData.error || `Failed to save quiz result: ${response.status}`)
    }

    const data = await response.json()
    console.log("Quiz result saved successfully:", data)
    return data
  } catch (error) {
    console.error("Error submitting quiz result:", error)
    throw error
  }
}

// Helper function to calculate similarity between two strings
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 100
  if (!str1 || !str2) return 0

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 100
  }

  // Direct match
  if (longer.toLowerCase() === shorter.toLowerCase()) {
    return 100
  }

  // Calculate Levenshtein distance
  const costs = new Array(shorter.length + 1)
  for (let i = 0; i <= shorter.length; i++) {
    costs[i] = i
  }

  for (let i = 0; i < longer.length; i++) {
    let lastValue = i + 1
    for (let j = 0; j < shorter.length; j++) {
      if (longer[i].toLowerCase() === shorter[j].toLowerCase()) {
        costs[j + 1] = lastValue
      } else {
        costs[j + 1] = Math.min(costs[j] + 1, costs[j + 1] + 1, lastValue + 1)
      }
      lastValue = costs[j + 1]
    }
  }

  const levenshteinDistance = costs[shorter.length]
  const similarityRatio = ((longer.length - levenshteinDistance) / longer.length) * 100

  return Math.round(similarityRatio)
}
