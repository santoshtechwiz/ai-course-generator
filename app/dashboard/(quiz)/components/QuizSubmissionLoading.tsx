"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { MotionWrapper } from "@/components/ui/animations/motion-wrapper"

export function QuizSubmissionLoading({ quizType }: { quizType: string }) {
  const [step, setStep] = useState(1)
  const [loadingText, setLoadingText] = useState("Submitting your answers")

  // Simulate different loading steps
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setStep(2)
        setLoadingText("Calculating results")
      }, 1500),
      setTimeout(() => {
        setStep(3)
        setLoadingText("Finalizing")
      }, 3000),
      setTimeout(() => {
        setStep(4)
        setLoadingText("Ready!")
      }, 4000),
    ]

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-8 min-h-[300px]">
        <MotionWrapper variant="zoom" duration={0.5}>
          <div className="flex flex-col items-center text-center space-y-6">
            {step < 4 ? (
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            )}

            <h2 className="text-2xl font-semibold">{loadingText}</h2>

            <div className="flex justify-center space-x-2 w-full mt-6">
              <div
                className={`h-2 w-16 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-primary" : "bg-gray-200"}`}
              />
              <div
                className={`h-2 w-16 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
              />
              <div
                className={`h-2 w-16 rounded-full transition-colors duration-300 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}
              />
              <div
                className={`h-2 w-16 rounded-full transition-colors duration-300 ${step >= 4 ? "bg-primary" : "bg-gray-200"}`}
              />
            </div>

            <p className="text-muted-foreground text-sm max-w-xs">
              {quizType === "code"
                ? "We're analyzing your code responses and calculating your score."
                : "We're processing your answers and preparing your results."}
            </p>
          </div>
        </MotionWrapper>
      </CardContent>
    </Card>
  )
}
