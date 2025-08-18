"use client"

import { use, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"
import { quizStore } from "@/lib/quiz-store"
import { QuizPlayer } from "../components/QuizPlay"
import { useGlobalLoader } from "@/store/loaders/global-loader"

interface DocumentQuizClientProps {
  params: Promise<{ quizId: string }>
}

export default function DocumentQuizClient({ params }: DocumentQuizClientProps) {
  // Properly unwrap the params Promise once at the top level
  const { quizId } = use(params);
  const router = useRouter()
  const [quizTitle, setQuizTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { startLoading, stopLoading } = useGlobalLoader()

  useEffect(() => {
    // Get quiz title for the header
    const loadQuiz = async () => {
      try {
        startLoading({
          message: "Loading Document Quiz...",
          subMessage: "Please wait while we prepare your quiz",
          isBlocking: true
        })
        
        const quiz = await quizStore.getQuiz(quizId)
        if (quiz?.title) {
          setQuizTitle(quiz.title)
        }
      } catch (error) {
        console.error("Failed to load quiz:", error)
      } finally {
        setLoading(false)
        stopLoading()
      }
    }

    loadQuiz()
  }, [quizId, startLoading, stopLoading])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-lg">Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Compact Header */}
      <div className="bg-card border-b w-full">
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleGoBack} className="h-7 px-2">
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span className="text-xs">Back</span>
              </Button>
              <h1 className="text-sm font-medium truncate">
                {quizTitle || "Document Quiz"}
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleGoHome} className="h-7 px-2">
              <Home className="w-3 h-3 mr-1" />
              <span className="text-xs">Dashboard</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="flex-1 w-full p-1 sm:p-2">
        <div className="bg-card rounded-lg border p-3 sm:p-4 h-full">
          <QuizPlayer quizId={quizId} />
        </div>
      </div>
    </div>
  )
}
