"use client"

import { use, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"
import { quizStore } from "@/lib/quiz-store"
import { QuizPlayer } from "../components/QuizPlay"

interface DocumentQuizClientProps {
  params: Promise<{ quizId: string }>
}

export default function DocumentQuizClient({ params }: DocumentQuizClientProps) {
  // Properly unwrap the params Promise once at the top level
  const { quizId } = use(params);
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
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <p>Loading quiz...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold truncate">
                {quizTitle || "Document Quiz"}
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleGoHome}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <QuizPlayer quizId={quizId} />
        </div>
      </div>
    </div>
  )
}
