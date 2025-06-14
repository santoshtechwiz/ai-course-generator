"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSelector, useDispatch } from "react-redux"
import { selectQuizResults, clearQuizState } from "@/store/slices/quiz-slice"
import { NoResults } from "@/components/ui/no-results"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { toast } from "sonner"
import { useEffect, useState } from "react"

interface CodeQuizResultProps {
  slug: string
}

export default function CodeQuizResult({ slug }: CodeQuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const results = useSelector(selectQuizResults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!results) {
      toast.error("No results found. Redirecting to quiz.")
      setTimeout(() => {
        router.push(`/dashboard/code/${slug}`)
      }, 1500)
    } else {
      setLoading(false)
    }
  }, [results, router, slug])

  const handleRetakeQuiz = () => {
    dispatch(clearQuizState())
    router.replace(`/dashboard/code/${slug}`)
  }

  if (loading) {
    return <QuizLoader message="Loading results..." subMessage="Please wait while we fetch your quiz results." />
  }

  if (!results) {
    return (
      <NoResults
        variant="quiz"
        title="Results Not Found"
        description="We couldn't load your quiz results. The quiz may not have been completed."
        action={{
          label: "Retake Quiz",
          onClick: handleRetakeQuiz,
        }}
      />
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{results.title || "Code Quiz Results"}</h1>
        <p className="text-muted-foreground">
          Completed on {new Date(results.completedAt).toLocaleDateString()} at{" "}
          {new Date(results.completedAt).toLocaleTimeString()}
        </p>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">{results.percentage}%</h2>
        <p className="text-muted-foreground">
          {results.score} out of {results.maxScore} correct
        </p>
      </div>
      <Button onClick={handleRetakeQuiz} className="mt-4">
        Retake Quiz
      </Button>
    </div>
  )
}
