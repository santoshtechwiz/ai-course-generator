"use client"

import { Alert } from "@/components/ui/alert"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import type { QuizAnswer } from "./QuizBase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import QuizAuthWrapper from "./QuizAuthWrapper"
import { getPerformanceLevel } from "./QuizResultBase"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileQuestion,
  Home,
  Loader2,
  RefreshCw,
  Trophy,
  X,
  ArrowLeft,
  Share2,
} from "lucide-react"
import { useQuiz } from "@/app/context/QuizContext"
import { motion } from "framer-motion"

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
  showAuthModal?: boolean // Add this prop
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
  showAuthModal = false, // Default to false
}: QuizResultDisplayProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasSaved, setHasSaved] = useState(preventAutoSave)
  const hasSavedRef = useRef(preventAutoSave)

  const performance = getPerformanceLevel(score)
  const minutes = Math.floor(totalTime / 60)
  const seconds = Math.round(totalTime % 60)
  const { getGuestResult, isAuthenticated } = useQuiz()
  const percentage = Number.parseFloat(score.toFixed(1))

  // Add a new ref to track if we're currently saving guest results
  const isSavingGuestResults = useRef(false)

  // Auto-save results if user is logged in and we haven't saved yet
  useEffect(() => {
    if (session?.user && !hasSavedRef.current && !preventAutoSave && !isSavingGuestResults.current) {
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
            const errorData = await response.text()
            let errorMessage = `Failed to save results: ${response.status}`

            try {
              const errorJson = JSON.parse(errorData)
              if (errorJson.error) {
                errorMessage = errorJson.error
              }
            } catch (e) {
              // If JSON parsing fails, use the raw error text if available
              if (errorData) errorMessage += ` - ${errorData}`
            }

            throw new Error(errorMessage)
          }

          setHasSaved(true)
          hasSavedRef.current = true
          toast({
            title: "Results saved",
            description: "Your quiz results have been saved successfully.",
          })
        } catch (error) {
          console.error("Error saving quiz results:", error)

          // Check if this is a deadlock error and retry after a delay
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          if (errorMessage.includes("deadlock") || errorMessage.includes("write conflict")) {
            toast({
              title: "Database busy",
              description: "We'll try again in a moment...",
            })

            // Retry after a short delay
            setTimeout(() => {
              setHasSaved(false)
              hasSavedRef.current = false
              setSaveError(null)
            }, 2000)
          } else {
            setSaveError(errorMessage)
            toast({
              title: "Error saving results",
              description: errorMessage,
              variant: "destructive",
            })
          }
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

  useEffect(() => {
    // If user just logged in and we have guest results, try to save them
    if (isAuthenticated && !hasSavedRef.current && !preventAutoSave && !isSaving) {
      const guestResult = getGuestResult(quizId)

      if (guestResult) {
        const saveGuestResults = async () => {
          // Set the ref to prevent the other effect from running
          isSavingGuestResults.current = true
          setIsSaving(true)
          setSaveError(null)

          try {
            // Add a small delay to ensure we don't hit the database at the exact same time
            await new Promise((resolve) => setTimeout(resolve, 500))

            const response = await fetch(`/api/quiz/${quizId}/complete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                quizId,
                score: guestResult.score,
                totalQuestions,
                correctAnswers,
                totalTime: guestResult.totalTime,
                type,
                completedAt: new Date().toISOString(),
                answers: guestResult.answers,
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
            hasSavedRef.current = true

            toast({
              title: "Guest results saved",
              description: "Your previous quiz results have been saved to your account.",
            })
          } catch (error) {
            console.error("Error saving guest results:", error)

            // Check if this is a deadlock error and retry after a delay
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            if (errorMessage.includes("deadlock") || errorMessage.includes("write conflict")) {
              toast({
                title: "Database busy",
                description: "We'll try again in a moment...",
              })

              // Retry after a short delay
              setTimeout(() => {
                setHasSaved(false)
                hasSavedRef.current = false
                setSaveError(null)
              }, 3000)
            } else {
              setSaveError(errorMessage)
              toast({
                title: "Error saving results",
                description: errorMessage,
                variant: "destructive",
              })
            }
          } finally {
            setIsSaving(false)
            isSavingGuestResults.current = false
          }
        }

        saveGuestResults()
      }
    }
  }, [
    isAuthenticated,
    hasSaved,
    preventAutoSave,
    getGuestResult,
    quizId,
    slug,
    type,
    totalQuestions,
    toast,
    correctAnswers,
    totalTime,
    score,
    isSaving,
  ])

  const handleRestart = () => {
    if (onRestart) {
      onRestart()
    } else {
      // Navigate to the quiz page to restart
      router.push(`/dashboard/${type}/${slug}`)
    }
  }

  const handleShare = async () => {
    try {
      const shareText = `I scored ${score.toFixed(0)}% on the "${title}" quiz!`
      const shareUrl = `${window.location.origin}/dashboard/${type}/${slug}`

      if (navigator.share) {
        await navigator.share({
          title: `Quiz Result: ${title}`,
          text: shareText,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        toast({
          title: "Link copied!",
          description: "Share your results with friends",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  // If auth modal is showing, render the results but with reduced opacity behind the modal
  // This way the user can see their results even if they choose to continue as guest
  if (showAuthModal) {
    return (
      <QuizAuthWrapper
        quizState={{
          quizId,
          quizType: type,
          quizSlug: slug,
          isCompleted: true,
        }}
        answers={answers}
        redirectPath={`/dashboard/${type}/${slug}?completed=true`}
        showAuthModal={showAuthModal}
      >
        <div className="container mx-auto py-6 px-4 md:px-6 max-w-4xl pointer-events-none">
          {/* Render a blurred version of the content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 0.5 }}
            className="filter blur-[2px]"
          >
            <Card className="border shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{title}</h1>
                <p className="text-center text-muted-foreground">Quiz Results</p>
              </div>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-4">
                    <div className="w-36 h-36 rounded-full flex items-center justify-center border-8 border-muted">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{percentage.toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </QuizAuthWrapper>
    )
  }

  // Original render code for authenticated users or when auth modal is not showing
  return (
    <QuizAuthWrapper>
      <div className="container mx-auto py-6 px-4 md:px-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/quizzes")}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Button>

          {isSaving ? (
            <Badge variant="outline" className="flex items-center gap-1.5 bg-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </Badge>
          ) : hasSaved ? (
            <Badge variant="outline" className="flex items-center gap-1.5 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3" />
              <span>Saved</span>
            </Badge>
          ) : null}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">{title}</h1>
              <p className="text-center text-muted-foreground">Quiz Results</p>
            </div>

            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Score Overview */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-4">
                  <div className="w-36 h-36 rounded-full flex items-center justify-center border-8 border-muted">
                    <div
                      className="absolute inset-0 rounded-full overflow-hidden"
                      style={{
                        clipPath: `inset(0 ${100 - percentage}% 0 0)`,
                      }}
                    >
                      <div className={`w-full h-full ${performance.bgColor} opacity-20`}></div>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${performance.color}`}>{percentage.toFixed(0)}%</div>
                      <div className="text-sm text-muted-foreground">Score</div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">{performance.label}</h2>
                  <p className="text-muted-foreground">{performance.message}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{correctAnswers}</div>
                    <div className="text-xs text-muted-foreground">Correct</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{totalQuestions - correctAnswers}</div>
                    <div className="text-xs text-muted-foreground">Incorrect</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Question Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-primary" />
                  Question Summary
                </h3>

                <div className="space-y-3">
                  {answers && answers.length > 0 ? (
                    answers.map((answer, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border ${
                          answer.isCorrect
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30"
                            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {answer.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            )}
                            <span className="font-medium">Question {index + 1}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>
                              {Math.floor(answer.timeSpent / 60)}:
                              {Math.round(answer.timeSpent % 60)
                                .toString()
                                .padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">No detailed results available</div>
                  )}
                </div>
              </div>

              {saveError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <div className="ml-2">
                    <div className="font-medium">Error saving results</div>
                    <div className="text-sm">{saveError}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHasSaved(false)
                        hasSavedRef.current = false
                        setSaveError(null)
                      }}
                      className="mt-2"
                      disabled={isSaving}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="p-6 md:p-8 border-t flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex-1 sm:flex-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleShare} className="flex-1 sm:flex-auto">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              <Button onClick={handleRestart} disabled={isSaving} className="flex-1 sm:flex-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart Quiz
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {score >= 80 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center"
          >
            <div className="flex justify-center mb-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Excellent Work!</h3>
            <p className="text-sm text-muted-foreground">You've mastered this topic. Ready for a new challenge?</p>
          </motion.div>
        )}
      </div>
    </QuizAuthWrapper>
  )
}
