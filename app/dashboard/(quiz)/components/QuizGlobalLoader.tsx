"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useGlobalLoader } from "@/store/loaders/global-loader"
import { selectQuizStatus, selectQuizTitle } from "@/store/slices/quiz/quiz-slice"

interface QuizGlobalLoaderProps {
  quizType?: string
}

export function QuizGlobalLoader({ quizType = "Quiz" }: QuizGlobalLoaderProps) {
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const { startLoading, stopLoading } = useGlobalLoader()

  useEffect(() => {
    if (quizStatus === "loading") {
      startLoading({
        message: `Loading...`,
        subMessage: undefined,
        isBlocking: true,
        autoProgress: true,
        minVisibleMs: 200,
      })
    } else if (quizStatus === "succeeded" || quizStatus === "failed") {
      stopLoading()
    }
  }, [quizStatus, quizTitle, quizType, startLoading, stopLoading])

  // Rely on the single GlobalLoader mounted at app level
  return null
}
