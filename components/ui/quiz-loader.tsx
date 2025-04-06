"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizLoaderProps {
  message: string
}

export function QuizLoader({ message }: QuizLoaderProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate progress increasing over time
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        // Slow down as we approach 100%
        const increment = Math.max(1, 10 - Math.floor(prevProgress / 10))
        const newProgress = prevProgress + increment

        // Cap at 95% to give the impression we're waiting for server response
        return newProgress >= 95 ? 95 : newProgress
      })
    }, 100)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-center">{message}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2 transition-all" />
        <p className="text-center text-sm text-muted-foreground">
          {progress < 30 && "Preparing your results..."}
          {progress >= 30 && progress < 60 && "Calculating your score..."}
          {progress >= 60 && progress < 90 && "Almost there..."}
          {progress >= 90 && "Finalizing your results..."}
        </p>
      </CardContent>
    </Card>
  )
}

