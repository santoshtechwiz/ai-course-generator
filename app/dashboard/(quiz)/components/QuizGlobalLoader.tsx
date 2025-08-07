"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useGlobalLoader } from "@/store/loaders/global-loader"
import { selectQuizStatus, selectQuizTitle } from "@/store/slices/quiz/quiz-slice"
import { GlobalLoader } from "@/components/loaders/GlobalLoader"

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
        message: `Loading ${quizType}...`,
        subMessage: quizTitle ? `Preparing "${quizTitle}"` : "Please wait while we prepare your quiz",
        isBlocking: true
      })
    } else if (quizStatus === "succeeded" || quizStatus === "failed") {
      stopLoading()
    }

    return () => {
      // Cleanup on unmount
      if (quizStatus === "loading") {
        stopLoading()
      }
    }
  }, [quizStatus, quizTitle, quizType, startLoading, stopLoading])

  return <GlobalLoader />
}
