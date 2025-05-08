"use client"

import type { ReactNode } from "react"
import { QuizProvider } from "@/context/QuizContext"

interface QuizProviderWrapperProps {
  children: ReactNode
  quizId?: string
  slug?: string
  quizType?: string
  quizData?: any
  callbackUrl?: string
}

export default function QuizProviderWrapper({
  children,
  quizId,
  slug,
  quizType,
  quizData,
  callbackUrl,
}: QuizProviderWrapperProps) {
  // Define the onAuthRequired function here in the client component
  const handleAuthRequired = (redirectUrl: string) => {
    // Use the callbackUrl if provided, otherwise use the redirectUrl
    const finalCallbackUrl = callbackUrl || redirectUrl

    console.log("Authentication required, redirecting to:", finalCallbackUrl)

    // CRITICAL FIX: Add a timestamp to prevent caching issues
    const timestampedUrl = `${finalCallbackUrl}${finalCallbackUrl.includes("?") ? "&" : "?"}ts=${Date.now()}`

    // Redirect to sign-in page with the callback URL
    window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(timestampedUrl)}`
  }

  return (
    <QuizProvider
      quizId={quizId}
      slug={slug}
      quizType={quizType}
      quizData={quizData}
      onAuthRequired={handleAuthRequired}
    >
      {children}
    </QuizProvider>
  )
}
