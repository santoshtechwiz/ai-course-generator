"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircleIcon, AlertTriangle, Trophy, Target, Share2, RefreshCw, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { BlanksQuizResult, BlanksQuizQuestionResult } from "@/types/blanks-quiz"
function getSimilarity(userAnswer: string, correctAnswer: string) {
  return getBestSimilarityScore(userAnswer || "", correctAnswer || "") / 100
}

function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.7) return "Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      emoji: "🏆",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
  }
}

interface BlankQuizResultsProps {
  result?: BlanksQuizResult
  onRetake?: () => void
  isAuthenticated?: boolean
  slug: string
}

export default function BlankQuizResults({ result, onRetake, isAuthenticated = true, slug }: BlankQuizResultsProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)

  const enhancedResults = useMemo(() => {
    if (!result?.questionResults) return []

    return result.questionResults.map((q) => {
      const userAnswer = q.userAnswer || ""
      const correctAnswer = q.correctAnswer || ""
      const similarity = q.similarity ?? getSimilarity(userAnswer, correctAnswer)
      const similarityLabel = q.similarityLabel || getSimilarityLabel(similarity)

      return {
        ...q,
        similarity,
        similarityLabel,
        isCorrect: q.isCorrect ?? similarity >= 0.7,
      }
    })
  }, [result])

  const correctCount = enhancedResults.filter((q) => q.isCorrect).length
  const percentage = result?.percentage ?? Math.round((correctCount / enhancedResults.length) * 100)
  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])

  useEffect(() => {
    const resultId = result?.completedAt
    if (result && resultId && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  const handleRetake = () => {
    if (onRetake) {
      onRetake()
    } else {
      router.push(`/dashboard/blanks/${slug}`)
    }
  }

  const handleViewAllQuizzes = () => {
    router.push("/dashboard/quizzes")
  }

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${result?.title || "Quiz"} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${result?.title || "Quiz"} fill-in-the-blanks quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast.success("Results copied to clipboard!")
      } else {
        toast.error("Sharing not supported on this device")
      }
    } catch (error) {
      toast.error("Failed to share results")
    }
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Unable to Load Results</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load your quiz results. The session may have expired or some data might be missing.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRetake} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Take Quiz Again
          </Button>
          <Button variant="outline" onClick={handleViewAllQuizzes} className="gap-2">
            <Home className="w-4 h-4" />
            Browse Quizzes
          </Button>
        </div>
      </div>
    )
  }

  if (!Array.isArray(result.questionResults)) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-bold mb-2">Invalid Results</CardTitle>
            <p className="text-muted-foreground">No valid question results found.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{result.title || "Fill in the Blanks Quiz Results"}</h1>
              <Badge
                variant="secondary"
                className={`mt-2 ${performance.color} ${performance.bgColor} ${performance.borderColor}`}
              >
                {performance.emoji} {performance.level}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Completed on {new Date(result.completedAt || new Date()).toLocaleDateString()} at{" "}
            {new Date(result.completedAt || new Date()).toLocaleTimeString()}
          </p>
        </div>

        {/* Score Overview */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Your Score</CardTitle>
                  <p className="text-muted-foreground">Fill-in-the-blanks performance summary</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">{percentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {correctCount} of {enhancedResults.length}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {correctCount}/{enhancedResults.length} correct
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
              <div className={`p-4 rounded-lg border-2 ${performance.bgColor} ${performance.borderColor}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{performance.emoji}</span>
                  <p className={`font-medium ${performance.color}`}>{performance.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-success">{correctCount}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-destructive">{enhancedResults.length - correctCount}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{enhancedResults.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t flex flex-wrap gap-3 justify-between p-4">
            <div className="flex gap-2">
              <Button onClick={handleRetake} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={handleViewAllQuizzes} className="gap-2">
                <Home className="w-4 h-4" />
                All Quizzes
              </Button>
            </div>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share Results
            </Button>
          </CardFooter>
        </Card>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Answer Review ({enhancedResults.length} Questions)
            </CardTitle>
            <p className="text-muted-foreground">Review your answers and learn from mistakes</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {enhancedResults.map((q, index) => (
              <div key={q.questionId} className="p-4 rounded-lg border">
                <div className="font-semibold mb-3">
                  Question {index + 1}: {q.question}
                </div>

                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-md border ${
                      q.isCorrect ? "bg-success/10 border-success/30" : "bg-muted border-muted-foreground/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          q.isCorrect ? "bg-success text-white" : "bg-muted-foreground/20"
                        }`}
                      >
                        Y
                      </div>
                      <span className="font-medium text-sm">Your answer:</span>
                    </div>
                    <div className="pl-7">
                      <span
                        className={
                          q.similarityLabel === "Correct"
                            ? "text-green-700"
                            : q.similarityLabel === "Close"
                              ? "text-yellow-700"
                              : "text-red-700"
                        }
                      >
                        {q.userAnswer || "(no answer)"}
                      </span>
                      {q.similarityLabel === "Close" && (
                        <span className="ml-2 text-xs text-yellow-700 font-semibold">(Close enough!)</span>
                      )}
                    </div>
                  </div>

                  {!q.isCorrect && (
                    <div className="p-3 rounded-md bg-success/10 border border-success/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center">
                          <CheckCircleIcon className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm">Correct answer:</span>
                      </div>
                      <p className="text-sm pl-7">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-3">
                  Similarity: {Math.round((q.similarity || 0) * 100)}% ({q.similarityLabel})
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
