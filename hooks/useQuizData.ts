import { useMutation } from "@tanstack/react-query"

interface SubmitQuizDataParams {
  slug: string
  quizId: number
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  elapsedTime: number
  score: number
  type: string
  userId?: string // New optional parameter
}

const submitQuizData = async ({
  slug,
  quizId,
  answers,
  elapsedTime,
  score,
  type,
  userId, // Include userId
}: SubmitQuizDataParams): Promise<void> => {
  const response = await fetch(`/api/quiz/${slug}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quizId,
      answers,
      totalTime: elapsedTime,
      score,
      type,
      ...(userId && { userId }), // Conditionally include userId
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to update score")
  }
}

export const useSubmitQuiz = () => {
  return useMutation({
    mutationFn: submitQuizData,
    onError: (error) => {
      console.error("Error submitting quiz data:", error)
    },
  })
}

