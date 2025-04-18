"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { QuizAnswer } from "./QuizBase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import QuizAuthWrapper from "./QuizAuthWrapper"
import { getPerformanceLevel } from "./QuizResultBase"
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  FileQuestion,
  ListChecks,
  Loader2,
  RefreshCcw,
  X,
} from "lucide-react"

interface QuizResultDisplayProps {
  quizId: string
  title: string
  score: number
  totalQuestions: number
  totalTime: number
  correctAnswers: number
  type: string
  slug: string
  answers?: QuizAnswer[]
  preventAutoSave?: boolean
  onRestart?: () => void
}

export function QuizResultDisplay({
  quizId,
  title,
  score,
  totalQuestions,
  totalTime,
  correctAnswers,
  type,
  slug,
  answers,
  preventAutoSave = false,
  onRestart,
}: QuizResultDisplayProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasSaved, setHasSaved] = useState(preventAutoSave)

  const performance = getPerformanceLevel(score)
  const minutes = Math.floor(totalTime / 60)
  const seconds = Math.round(totalTime % 60)

  // Auto-save results if user is logged in and we haven't saved yet
  useEffect(() => {
    if (session?.user && !hasSaved && !preventAutoSave) {
      const saveResults = async () => {
        setIsSaving(true)
        setSaveError(null)

        try {
          // Ensure answers is always an array
          const formattedAnswers = answers || []

          console.log("Saving quiz results:", {
            quizId,
            score,
            totalQuestions,
            correctAnswers,
            totalTime,
            type,
            answers: formattedAnswers,
          })

          const response = await fetch(`/api/quiz/${quizId}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quizId,
              score,
              totalQuestions,
              correctAnswers,
              totalTime,
              type,
              completedAt: new Date().toISOString(),
              answers: formattedAnswers,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `Failed to save results: ${response.status}`

            try {
              const errorData = JSON.parse(errorText)
              if (errorData.error) {
                errorMessage = errorData.error
              }
            } catch (e) {
              // If JSON parsing fails, use the raw error text if available
              if (errorText) errorMessage += ` - ${errorText}`
            }

            throw new Error(errorMessage)
          }

          setHasSaved(true)
          toast({
            title: "Results saved",
            description: "Your quiz results have been saved successfully.",
          })
        } catch (error) {
          console.error("Error saving quiz results:", error)
          setSaveError(error instanceof Error ? error.message : "Unknown error")
          toast({
            title: "Error saving results",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          })
        } finally {
          setIsSaving(false)
        }
      }

      saveResults()
    }
  }, [
    session,
    hasSaved,
    preventAutoSave,
    quizId,
    score,
    totalQuestions,
    correctAnswers,
    totalTime,
    type,
    answers,
    toast,
  ])

  const handleRestart = () => {
    if (onRestart) {
      onRestart()
    } else {
      // Navigate to the quiz page to restart
      router.push(`/dashboard/${type}/${slug}`)
    }
  }

  return (
    <QuizAuthWrapper>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="grid gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">Quiz Results</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRestart} variant="outline" disabled={isSaving}>
                Restart Quiz
              </Button>
              <Button onClick={() => router.push("/dashboard/quizzes")} variant="outline">
                Back to Quizzes
              </Button>
            </div>
          </div>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="space-y-6">
              <Card className="overflow-hidden border-muted/60">
                <CardHeader className="bg-muted/30 border-b border-muted/60">
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    Quiz Performance
                  </CardTitle>
                  <CardDescription>
                    {isSaving ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                        Saving your results...
                      </div>
                    ) : hasSaved ? (
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Your results have been saved.
                      </div>
                    ) : saveError ? (
                      <div className="flex items-center text-red-500">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Error: {saveError}
                      </div>
                    ) : (
                      ""
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Score</div>
                      <div className="text-sm font-medium flex items-center">
                        <span
                          className={`text-lg font-bold ${score >= 70 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500"}`}
                        >
                          {score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={score}
                      className="h-2.5 rounded-full"
                      indicatorClassName={`${performance.bgColor} rounded-full transition-all duration-500 ease-in-out`}
                    />
                    <p className="text-sm text-muted-foreground flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-2 ${performance.bgColor}`}></span>
                      {performance.message}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="overflow-hidden border-muted/60">
                      <CardHeader className="p-4 bg-muted/30 border-b border-muted/60">
                        <CardTitle className="text-base flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          Time Spent
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-4">
                        <div className="text-2xl font-bold flex items-baseline">
                          {minutes}
                          <span className="text-lg mx-1">m</span>
                          {seconds}
                          <span className="text-lg ml-1">s</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="overflow-hidden border-muted/60">
                      <CardHeader className="p-4 bg-muted/30 border-b border-muted/60">
                        <CardTitle className="text-base flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-4">
                        <div className="text-2xl font-bold flex items-baseline">
                          <span className={correctAnswers === totalQuestions ? "text-green-500" : ""}>
                            {correctAnswers}
                          </span>
                          <span className="text-lg mx-1">/</span>
                          {totalQuestions}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleRestart} className="w-full sm:w-auto flex-1 sm:flex-none" disabled={isSaving}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Restart Quiz
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/quizzes")}
                    variant="outline"
                    className="w-full sm:w-auto flex-1 sm:flex-none"
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    Back to Quizzes
                  </Button>
                </CardFooter>
                {saveError && (
                  <div className="mt-2 p-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHasSaved(false)
                        setSaveError(null)
                      }}
                      disabled={isSaving}
                    >
                      <RefreshCcw className="mr-2 h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>
            <TabsContent value="details" className="space-y-6">
              <Card className="overflow-hidden border-muted/60">
                <CardHeader className="bg-muted/30 border-b border-muted/60">
                  <CardTitle className="flex items-center">
                    <ListChecks className="mr-2 h-5 w-5 text-primary" />
                    Detailed Results
                  </CardTitle>
                  <CardDescription>See your performance on each question</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {answers && answers.length > 0 ? (
                    <div className="space-y-4">
                      {answers.map((answer, index) => (
                        <Card
                          key={index}
                          className={`p-4 border-l-4 ${answer.isCorrect ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/10" : "border-l-red-500 bg-red-50/50 dark:bg-red-950/10"}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Question {index + 1}</p>
                              <p className="text-sm text-muted-foreground flex items-center mt-1">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {Math.floor(answer.timeSpent / 60)}m {Math.round(answer.timeSpent % 60)}s
                              </p>
                            </div>
                            <div
                              className={
                                answer.isCorrect ? "text-green-500 flex items-center" : "text-red-500 flex items-center"
                              }
                            >
                              {answer.isCorrect ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1.5" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1.5" />
                                  Incorrect
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No detailed results available for this quiz.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </QuizAuthWrapper>
  )
}
