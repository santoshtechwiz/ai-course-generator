const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"

export type QuizType = "daily" | "weekly" | "monthly"

export interface Quiz {
  slug: string
  title: string
  description: string
  questions: Question[]
}

export interface Question {
  text: string
  options: string[]
  correctAnswer: number
}

export interface QuizResult {
  correctAnswers: number
  totalQuestions: number
  score: number
  completionTime: number
}

export async function getQuizData(slug: string, quizType: QuizType = "daily"): Promise<Quiz> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/quiz/${quizType}/${slug}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch quiz data: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Request timeout for quiz data: slug=${slug}, type=${quizType}`)
      throw new Error("Request timed out. Please check your connection and try again.")
    }
    console.error("Error fetching quiz data:", error)
    throw new Error("Failed to fetch quiz data. Please try again later.")
  }
}

export async function submitQuiz(
  slug: string,
  quizType: QuizType,
  answers: number[],
  completionTime: number,
): Promise<QuizResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/quiz/${quizType}/${slug}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers, completionTime }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to submit quiz: ${response.status} ${response.statusText}`)
    }

    const result: QuizResult = await response.json()
    return result
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Quiz result fetch timed out")
      throw new Error("Request timed out. Please try again later.")
    }
    console.error("Error submitting quiz:", error)
    throw new Error("Failed to submit quiz. Please try again later.")
  }
}
