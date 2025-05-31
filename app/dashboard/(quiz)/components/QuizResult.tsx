"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { resetQuiz } from "@/store/slices/quizSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Check, RefreshCw, ChevronRight } from "lucide-react"
import { useSessionService } from "@/hooks/useSessionService"

// Import CodeQuizResult and MCQQuizResult
import CodeQuizResult from "../code/components/CodeQuizResult"
import MCQQuizResult from "../mcq/components/McqQuizResult"

interface QuizResultProps {
  result: any
  onRetake?: () => void
  quizType: "code" | "mcq"
}

export default function QuizResult({ result, onRetake, quizType }: QuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { clearQuizResults } = useSessionService()

  const handleRetake = useCallback(() => {
    if (onRetake) {
      // Clear results before retaking
      clearQuizResults()
      onRetake()
    } else if (result?.slug) {
      clearQuizResults()
      router.push(`/dashboard/${quizType}/${result.slug}?reset=true`)
    }
  }, [onRetake, result?.slug, quizType, router, clearQuizResults])

  const handleBrowseQuizzes = useCallback(() => {
    // Clear quiz state when navigating away
    clearQuizResults()
    router.push('/dashboard/quizzes')
  }, [router, clearQuizResults])
  
  // If no result data, show empty state
  if (!result) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-3">No Results Available</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find any quiz results. Try taking a quiz first!
          </p>
          <Button onClick={handleBrowseQuizzes}>Browse Quizzes</Button>
        </CardContent>
      </Card>
    )
  }

  // Delegate to the appropriate result component based on quiz type
  if (quizType === "code") {
    return <CodeQuizResult result={result} onRetake={handleRetake} />
  } else if (quizType === "mcq") {
    return <MCQQuizResult result={result} />
  }

  // Fallback generic result UI
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{result.title || "Quiz Results"}</h2>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="text-5xl font-bold text-primary">{result.percentage}%</div>
          <div className="text-xl text-muted-foreground">Score</div>
        </div>
        <p className="mt-2 text-muted-foreground">
          You got {result.score} out of {result.maxScore} questions correct
        </p>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <Button onClick={handleRetake} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button onClick={handleBrowseQuizzes} className="gap-2">
          Browse Quizzes
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
