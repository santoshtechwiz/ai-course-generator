"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { quizStorageService } from "@/lib/quiz-storage-service"
import SignInPrompt from "./SignInPrompt"

interface QuizAuthWrapperProps {
  children: React.ReactNode
  quizId: string
  quizType: string
  slug: string
}

export default function QuizAuthWrapper({ children, quizId, quizType, slug }: QuizAuthWrapperProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      setIsLoading(false)
    }
  }, [status])

  // Check for pending quiz results on mount
  useEffect(() => {
    if (status === "authenticated") {
      const pendingResult = quizStorageService.getPendingQuizResult()
      if (pendingResult && pendingResult.quizId === quizId) {
        // Save the pending result to the user's account
        quizStorageService.saveQuizResult(pendingResult)
        // Clear the pending result
        quizStorageService.clearPendingQuizResult()
      }
    }
  }, [quizId, status])

  if (isLoading) {
    return <div>Loading...</div>
  }


  if (status === "unauthenticated") {
    // Save pending quiz result for unauthenticated users
    const pendingResult = quizStorageService.getQuizResult(quizId)
    if (pendingResult) {
      quizStorageService.savePendingQuizResult(pendingResult)
    }

    return <SignInPrompt callbackUrl={`/dashboard/${quizType}/${slug}`} />
  }

  return <>{children}</>
}
