"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import GuestSignInPrompt  from "../../components/GuestSignInPrompt"
import { useQuiz } from "@/app/context/QuizContext"
import { useAuth } from "@/providers/unified-auth-provider"

interface QuizResultsOpenEndedProps {
  quizId?: string
  slug?: string
  title?: string
  answers?: any[]
  questions?: any[]
  totalQuestions?: number
  startTime?: number
  score?: number
  onRestart?: () => void
  onSignIn?: () => void
  isGuestMode?: boolean
}

export default function QuizResultsOpenEnded({
  quizId,
  slug,
  title,
  answers = [],
  questions = [],
  totalQuestions = 0,
  startTime = 0,
  score = 0,
  onRestart,
  onSignIn,
  isGuestMode = false,
}: QuizResultsOpenEndedProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("summary")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { handleAuthenticationRequired } = useQuiz()
  const { isAuthenticated } = useAuth()

  // Calculate total time spent
  const totalTimeSpent = answers.reduce((total, answer) => total + (answer?.timeSpent || 0), 0)
  const formattedTime = formatTime(totalTimeSpent)

  // Calculate accuracy
  const correctAnswers = answers.filter((answer) => answer?.isCorrect).length
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

  // Handle restart
  const handleRestart = () => {
    if (onRestart) {
      onRestart()
    }
  }

  // Handle create new quiz
  const handleCreateNew = () => {
    router.push("/dashboard/openended")
  }

  // If there's an error, show error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-card rounded-lg shadow-sm border"
      >
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Results</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="error-message">
          {error || "Failed to load results. Please try again."}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setError(null)} variant="default">
            Try Again
          </Button>
          <Button onClick={handleRestart} variant="outline">
            Restart Quiz
          </Button>
        </div>
      </motion.div>
    )
  }

  // If guest mode is active and user is not authenticated, show sign-in prompt
  if (isGuestMode && !isAuthenticated) {
    return (
      <GuestSignInPrompt
        quizId={quizId || "unknown"}
        forceShow={true}
        onContinueAsGuest={handleRestart}
      
        title="Sign in to view your results"
        description="Your quiz has been completed! Sign in to view your detailed results and save your progress."
        ctaText="Sign in to view results"
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title || "Quiz Results"}</CardTitle>
          <CardDescription>
            You've completed the open-ended quiz with {correctAnswers} out of {totalQuestions} correct answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="answers">Your Answers</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">Score</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-2xl font-bold"
                    >
                      {Math.round(accuracy)}%
                    </motion.div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      style={{ transformOrigin: "left" }}
                    >
                      <Progress value={accuracy} className="h-2 mt-2" />
                    </motion.div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">Time</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{formattedTime}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">
                      {correctAnswers}/{totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">correct answers</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="answers" className="space-y-4 pt-4">
              {questions.map((question, index) => {
                const answer = answers[index]
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2 bg-muted/50">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <span className="mr-2">Question {index + 1}</span>
                          {answer?.isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium mb-2">{question.question}</div>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Your Answer:</div>
                            <div className="text-sm mt-1 p-2 bg-muted rounded-md">
                              {answer?.answer || "No answer provided"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Time Spent:</div>
                            <div className="text-sm">{formatTime(answer?.timeSpent || 0)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => (window.location.href = "/dashboard")} variant="default">
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
