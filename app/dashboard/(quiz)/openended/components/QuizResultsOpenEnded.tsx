"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { diffChars } from "diff"
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, RotateCw } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getPerformanceLevel, QuizResultBase } from "../../components/QuizResultBase"
import { QuizResultWrapper } from "../../components/QuizResultWrapper"
import { useSession } from "next-auth/react"
import { QuizFeedback } from "../../components/QuizFeedback"

interface QuizResultsProps {
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  questions: { id: number; question: string; answer: string }[]
  onRestart: () => void
  onComplete: (score: number) => void
  quizId: string
  title: string
  slug: string
  clearGuestData?: () => void
}

export default function QuizResultsOpenEnded({
  answers,
  questions,
  onRestart,
  onComplete,
  quizId,
  title,
  slug,
  clearGuestData,
}: QuizResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const hasCalledComplete = useRef(false)
  const hasSavedToDatabase = useRef(false)
  const { data: session } = useSession()

  // Calculate score only once
  const score = useRef(calculateScore(answers, questions)).current
  const totalTime = useRef(answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0)).current

  // Call onComplete only once and save to database if authenticated
  useEffect(() => {
    const saveResults = async () => {
      setIsLoading(true)
      try {
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true
          onComplete(score)
        }

        if (session?.user && !hasSavedToDatabase.current && quizId) {
          hasSavedToDatabase.current = true

          const formattedAnswers = answers.map((answer) => ({
            userAnswer: answer.answer || "",
            timeSpent: answer.timeSpent || 0,
            hintsUsed: answer.hintsUsed || false,
          }))

          await saveQuizResultToDatabase(quizId, formattedAnswers, totalTime, score, "openended")
        }
        setIsSuccess(true)
      } catch (error) {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    saveResults()
  }, [score, onComplete, session, quizId, answers, totalTime])

  if (isLoading || isSuccess || isError) {
    return (
      <QuizFeedback
        score={score}
        totalQuestions={questions.length}
        isSubmitting={isLoading}
        isSuccess={isSuccess}
        isError={isError}
        onContinue={() => setIsSuccess(false)} // Reset success state to show results
        quizType="openended"
      />
    )
  }

  const performance = getPerformanceLevel(score)

  const toggleExpanded = (index: number) => {
    setExpandedQuestions((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const handleRestart = () => {
    setIsLoading(true)
    setTimeout(() => {
      onRestart()
      setIsLoading(false)
    }, 500)
  }

  return (
    <QuizResultWrapper quizId={quizId} slug={slug} quizType="openended" onClearGuestData={clearGuestData}>
      <QuizResultBase
        quizId={quizId}
        title={title}
        score={score}
        totalQuestions={questions.length}
        totalTime={totalTime}
        slug={slug}
        quizType="openended"
        clearGuestData={clearGuestData}
      >
        <div className="max-w-4xl mx-auto p-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center justify-between">
                <span>Quiz Results</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestart}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                  Restart Quiz
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-3xl font-bold mb-2">{score.toFixed(1)}%</p>
                <Progress value={score} className="w-full h-2" indicatorClassName={performance.bgColor} />
                <p className="mt-2 text-sm text-muted-foreground">{performance.message}</p>
              </div>

              {questions.map((question, index) => {
                if (!question || !answers[index]) return null

                const similarity = calculateSimilarity(question.answer, answers[index].answer)
                const isExpanded = expandedQuestions.includes(index)

                return (
                  <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleExpanded(index)}>
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex justify-between items-center">
                          <span>Question {index + 1}</span>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                              {isExpanded ? "Hide Details" : "Show Details"}
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Fix for hydration error - Use div instead of p for content that might contain divs */}
                        <div className="mb-2">{question.question}</div>
                        <div className="flex items-center gap-2 mb-2">
                          {similarity >= 90 ? (
                            <CheckCircle className="text-green-500" />
                          ) : similarity > 70 ? (
                            <AlertTriangle className="text-yellow-500" />
                          ) : (
                            <XCircle className="text-red-500" />
                          )}
                          <span>Accuracy: {similarity.toFixed(1)}%</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          Time spent: {Math.floor(answers[index].timeSpent / 60)}m{" "}
                          {Math.round(answers[index].timeSpent % 60)}s
                        </p>
                        <CollapsibleContent>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-1">Your Answer:</h4>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 whitespace-pre-wrap">
                              {answers[index].answer || "(No answer provided)"}
                            </div>
                            <h4 className="font-semibold mb-1">Model Answer:</h4>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 whitespace-pre-wrap">
                              {question.answer}
                            </div>
                            {/* Only show diff for expanded questions */}
                            {isExpanded && (
                              <>
                                <h4 className="font-semibold mb-1">Comparison:</h4>
                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap">
                                  {renderDiff(question.answer, answers[index].answer)}
                                </div>
                              </>
                            )}
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </QuizResultBase>
    </QuizResultWrapper>
  )
}

// Add this function to save results to the database
async function saveQuizResultToDatabase(
  quizId: string,
  answers: { userAnswer: string; timeSpent: number; hintsUsed: boolean }[],
  totalTime: number,
  score: number,
  quizType: string,
) {
  try {
    const response = await fetch(`/api/quiz/${quizId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId,
        answers,
        totalTime,
        score,
        type: quizType,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Failed to save quiz results to database", errorData)
    }
  } catch (error) {
    console.error("Error saving quiz results:", error)
  }
}

function calculateScore(answers: { answer: string }[], questions: { answer: string }[]): number {
  const totalSimilarity = answers.reduce((acc, answer, index) => {
    if (!answer || !questions[index]) return acc

    const correctAnswer = questions[index].answer?.toLowerCase()
    const userAnswer = answer.answer?.toLowerCase()
    const similarity = calculateSimilarity(correctAnswer, userAnswer)
    return acc + similarity
  }, 0)

  return Math.round(totalSimilarity / questions.length)
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  const longerLength = longer.length

  if (longerLength === 0) return 100

  const editDistance = levenshteinDistance(longer, shorter)
  return Math.max(0, Math.min(100, (1 - editDistance / longerLength) * 100))
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1
      }
    }
  }

  return dp[m][n]
}

function renderDiff(correct: string, user: string) {
  if (!correct || !user) return null

  const diff = diffChars(correct?.toLowerCase(), user?.toLowerCase())
  return diff.map((part, index) => (
    <span
      key={index}
      className={
        part.added
          ? "bg-red-200 dark:bg-red-800"
          : part.removed
            ? "bg-green-200 dark:bg-green-800"
            : "bg-gray-100 dark:bg-gray-700"
      }
    >
      {part.value}
    </span>
  ))
}
