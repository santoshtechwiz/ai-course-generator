"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface QuizSubmissionLoadingProps {
  quizType: "mcq" | "code" | "openended" | "blanks"
  message?: string
}

export function QuizSubmissionLoading({
  quizType,
  message,
}: QuizSubmissionLoadingProps) {
  const [loadingMessage, setLoadingMessage] = useState<string>(
    message || "Processing your submission..."
  )
  const [dots, setDots] = useState(".")

  // Add animation for loading dots
  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."))
    }, 500)

    return () => clearInterval(timer)
  }, [])

  // Update loading message after a delay to improve UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingMessage("Almost there! Finalizing your results...")
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const quizTypeName =
    quizType === "mcq"
      ? "Multiple Choice Quiz"
      : quizType === "code"
      ? "Coding Challenge"
      : quizType === "openended"
      ? "Open Ended Quiz"
      : "Fill in the Blanks Quiz"

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[60vh] p-4" 
      data-testid="quiz-submission-loading"
    >
      <div className="mb-8 relative">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
      <h3 className="text-2xl font-medium mb-2 text-center">
        {loadingMessage}
        <span className="inline-block w-[20px]">{dots}</span>
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Please wait while we process your {quizTypeName.toLowerCase()} submission. This won't take long.
      </p>
    </div>
  )
}
