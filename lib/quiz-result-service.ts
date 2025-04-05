import { toast } from "@/hooks/use-toast"

export interface QuizResultData {
  slug: string
  quizId: number
  answers: any[]
  elapsedTime: number
  score: number
  type: string
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function extractUserAnswer(answer: any): string | string[] {
  if (!answer) return ""

  if (typeof answer.userAnswer !== "undefined") {
    return answer.userAnswer
  }

  if (typeof answer.answer !== "undefined") {
    return answer.answer
  }

  return ""
}

export async function saveQuizResult(data: QuizResultData): Promise<boolean> {
  try {
    const response = await fetch(`/api/quiz/${data.slug}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId: data.quizId.toString(),
        answers: data.answers,
        totalTime: data.elapsedTime,
        score: data.score,
        type: data.type,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error saving quiz result:", errorData)
      throw new Error(errorData.error || "Failed to save quiz results")
    }

    return true
  } catch (error) {
    console.error("Error in saveQuizResult:", error)
    toast({
      variant: "destructive",
      title: "Error saving quiz results",
      description: error instanceof Error ? error.message : "An unknown error occurred",
    })
    return false
  }
}

