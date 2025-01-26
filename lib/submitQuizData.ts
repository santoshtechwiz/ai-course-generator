
import { toast } from "@/hooks/use-toast"


interface SubmitQuizDataParams {
  slug: string
  quizId: number
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  elapsedTime: number
  score: number,
  type: string
}

export async function submitQuizData({
  slug,
  quizId,
  answers,
  elapsedTime,
  score,
  type,
}: SubmitQuizDataParams): Promise<void> {


  try {
    const response = await fetch(`/api/quiz/${slug}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId,
        answers,
        totalTime: elapsedTime,
        score,
        type
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update score")
    }

    // Show success toast
    toast({
      title: "Quiz Completed",
      description: `Your score: ${score.toFixed(1)}%`,
      variant: "success",
    })
  } finally {

  }
}

