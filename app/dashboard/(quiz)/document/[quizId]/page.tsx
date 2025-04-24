"use client"

import { useState, useEffect } from "react"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"
import { quizStore } from "@/lib/quiz-store"
import { QuizPlayer } from "../components/QuizPlay"

export default function PlayQuizPage() {
  const params = useParams()
  const quizId = params.quizId as string
  const router = useRouter()
  const [quizTitle, setQuizTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get quiz title for the header
    const quiz = quizStore.getQuiz(quizId)
    if (quiz) {
      setQuizTitle(quiz.title)
    }
    setLoading(false)
  }, [quizId])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleGoHome}>
              <Home className="h-4 w-4" />
            </Button>
            {!loading && quizTitle && <h1 className="text-xl font-bold ml-2">{quizTitle}</h1>}
          </div>
        </div>

        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading Quiz...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <QuizPlayer quizId={quizId} />
        )}
      </div>
    </div>
  )
}
