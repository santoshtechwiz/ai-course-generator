
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
}: SubmitQuizDataParams, setLoading?: (state: boolean) => void): Promise<void> {
  try {
    if (setLoading) setLoading(true); // Show 
    const response = await fetch(`/api/quiz/${slug}/complete`, {
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
  finally {
    if (setLoading) setLoading(false); // Hide loader
  }
}
