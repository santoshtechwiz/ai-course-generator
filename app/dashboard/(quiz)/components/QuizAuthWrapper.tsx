"use client"

import { useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { quizStorageService } from "@/lib/quiz-storage-service"
import SignInPrompt from "./SignInPrompt"

interface QuizAuthWrapperProps {
  children: React.ReactNode
  quizId: string
  quizType: string
  slug: string
}

export default function QuizAuthWrapper({
  children,
  quizId,
  quizType,
  slug,
}: QuizAuthWrapperProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      setIsLoading(false)
    }
  }, [status])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!quizType || !slug) {
    return <div>Error: Missing quiz type or slug.</div>
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
