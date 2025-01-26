
interface SubmitQuizDataParams {
  slug: string
  quizId: number
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  elapsedTime: number
  score: number
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quiz/${slug}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId,
        answers,
        totalTime: elapsedTime,
        score,
        type,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update score")
    }
  } catch (error) {
    console.error("Error submitting quiz data:", error)
    throw error
  }
}

