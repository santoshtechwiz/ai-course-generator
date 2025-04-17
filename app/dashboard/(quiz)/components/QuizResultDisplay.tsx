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
        try {
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
              answers: answers || [],
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to save results: ${response.status}`)
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
            description: "There was a problem saving your quiz results.",
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
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Performance</CardTitle>
                  <CardDescription>
                    {isSaving ? "Saving your results..." : hasSaved ? "Your results have been saved." : ""}
                    {saveError && <span className="text-red-500">Error: {saveError}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Score</div>
                      <div className="text-sm font-medium">{score.toFixed(1)}%</div>
                    </div>
                    <Progress value={score} className="h-2" indicatorClassName={performance.bgColor} />
                    <p className="text-xs text-muted-foreground">{performance.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">Time Spent</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {minutes}m {seconds}s
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">Questions</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {correctAnswers}/{totalQuestions}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleRestart} className="w-full" disabled={isSaving}>
                    Restart Quiz
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Results</CardTitle>
                  <CardDescription>See your performance on each question</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This section will show detailed results for each question when available.
                  </p>
                  {/* This would be populated with question-specific results */}
                  <div className="space-y-4">
                    {answers && answers.length > 0 ? (
                      answers.map((answer, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Question {index + 1}</p>
                              <p className="text-sm text-muted-foreground">
                                Time: {Math.floor(answer.timeSpent / 60)}m {Math.round(answer.timeSpent % 60)}s
                              </p>
                            </div>
                            <div className={answer.isCorrect ? "text-green-500" : "text-red-500"}>
                              {answer.isCorrect ? "Correct" : "Incorrect"}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p>No detailed results available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </QuizAuthWrapper>
  )
}
