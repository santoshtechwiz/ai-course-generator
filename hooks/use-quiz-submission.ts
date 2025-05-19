import { useCallback } from "react"
import { useAppDispatch } from "@/store"
import { submitAnswer } from "@/app/store/slices/textQuizSlice"
import type { QuizAnswer } from "@/types/quiz"
import { useToast } from "@/hooks/use-toast"

export function useQuizSubmission() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  const submitQuizAnswer = useCallback(
    async (answer: QuizAnswer) => {
      try {
        await dispatch(submitAnswer(answer)).unwrap()
        return true
      } catch (error) {
        toast({
          title: "Error submitting answer",
          description: "Please try again",
          variant: "destructive",
        })
        return false
      }
    },
    [dispatch, toast]
  )

  return { submitQuizAnswer }
}
