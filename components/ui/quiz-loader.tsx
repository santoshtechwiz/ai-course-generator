"use client"

import { useGlobalLoading } from "@/store/slices/global-loading-slice"
import { useEffect } from "react"

export function QuizLoader() {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    const loaderId = showLoading({
      message: "Loading Quizzes...",
      subMessage: "Fetching your personalized content",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: false,
      priority: 1
    })

    return () => {
      hideLoading(loaderId)
    }
  }, [showLoading, hideLoading])

  return null // Loading handled by GlobalLoader
}
