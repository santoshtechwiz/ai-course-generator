"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import React from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import { QuizResultBase, getPerformanceLevel } from "../../components/QuizResultBase"
import { calculateSimilarity } from "@/hooks/quiz-session-storage"

interface BlankQuizResultsProps {
  answers: { answer: string; timeSpent: number; hintsUsed: boolean; similarity?: number }[]
  questions: { id: number; question: string; answer: string }[]
  onRestart: () => void
  onComplete: (score: number) => void
  quizId: string
  title: string
  slug: string
  clearGuestData?: () => void
}

export default function BlankQuizResults({
  answers,
  questions,
  onRestart,
  onComplete,
  quizId,
  title,
  slug,
  clearGuestData,
}: BlankQuizResultsProps) {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveCompleted, setSaveCompleted] = useState(false)
  const router = useRouter()

  // Add this debugging log at the beginning of the component to see what data we're receiving
  console.log("BlankQuizResults received:", {
    answersLength: answers?.length,
    answers,
    questionsLength: questions?.length,
    quizId,
    slug,
  })

  // Modify the useMemo calculation to handle empty answers better
  const { score, results } = useMemo(() => {
    // Add defensive check for empty answers
    if (!answers || answers.length === 0) {
      console.warn("No answers provided to BlankQuizResults")
      // Create empty results with default values
      const emptyResults = questions.map((question) => ({
        ...question,
        userAnswer: "",
        correctAnswer: question.answer,
        similarity: 0,
        timeSpent: 0,
        isCorrect: false,
      }))
      return { score: 0, results: emptyResults }
    }

    const calculatedResults = questions.map((question, index) => {
      // If we don't have an answer for this question, provide a default
      if (!answers[index]) {
        console.warn(`No answer found for question ${index}`)
        return {
          ...question,
          userAnswer: "",
          correctAnswer: question.answer,
          similarity: 0,
          timeSpent: 0,
          isCorrect: false,
        }
      }

      // If similarity is already calculated, use it
      if (answers[index]?.similarity !== undefined) {
        return {
          ...question,
          userAnswer: answers[index]?.answer?.trim() || "",
          correctAnswer: question.answer,
          similarity: answers[index].similarity!,
          timeSpent: answers[index]?.timeSpent || 0,
          isCorrect: (answers[index].similarity || 0) > 80,
        }
      }

      // Otherwise calculate it
      const userAnswer = answers[index]?.answer?.trim()?.toLowerCase() || ""
      const correctAnswer = question.answer?.trim()?.toLowerCase() || ""
      const similarity = calculateSimilarity(correctAnswer, userAnswer)

      // Store the similarity in the answers array for future reference
      if (answers[index]) {
        answers[index].similarity = similarity
      }

      return {
        ...question,
        userAnswer: answers[index]?.answer?.trim() || "",
        correctAnswer: question.answer,
        similarity,
        timeSpent: answers[index]?.timeSpent || 0,
        isCorrect: similarity > 80,
      }
    })

    const totalScore = calculatedResults.reduce((acc, result) => acc + result.similarity, 0)
    const averageScore = Math.min(100, totalScore / Math.max(1, calculatedResults.length))

    return { score: averageScore, results: calculatedResults }
  }, [answers, questions])

  const hasCalledComplete = useRef(false)
  const totalTime = useMemo(() => answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0), [answers])

  useEffect(() => {
    if (!hasCalledComplete.current) {
      hasCalledComplete.current = true
      onComplete(Math.round(score))

      // Log the answers for debugging
      console.log("Displaying quiz results with answers:", answers)
    }

    // If user is not logged in and clearGuestData is provided, call it
    if (!session?.user && clearGuestData) {
      // Don't clear immediately - give user time to see results
      const timer = setTimeout(() => {
        clearGuestData()
      }, 300000) // 5 minutes

      return () => clearTimeout(timer)
    }
  }, [score, onComplete, session, clearGuestData, answers])

  const performance = getPerformanceLevel(score)

  const handleRestart = () => {
    // Clear session storage for this quiz
    if (typeof window !== "undefined") {
      // Clear all storage related to this quiz
      sessionStorage.removeItem(`quiz_result_${quizId}`)
      localStorage.removeItem(`quiz_result_${quizId}`)
      sessionStorage.removeItem(`quiz_state_blanks_${quizId}`)
      localStorage.removeItem(`quiz_answers_${quizId}`)

      // Also clear any other related storage
      const storageKey = `quiz_${slug}_fill-blanks`
      sessionStorage.removeItem(storageKey)
    }

    // Reset all state before restarting
    hasCalledComplete.current = false
    setSaveCompleted(false)
    setSaveError(null)

    // Call the provided onRestart function
    onRestart()

    // Force a page refresh to ensure all state is reset
    router.refresh()

    // Navigate back to the quiz page
    router.push(`/dashboard/blanks/${slug}`)
  }

  return (
    <QuizResultBase
      quizId={quizId}
      title={title}
      score={score}
      totalQuestions={questions.length}
      totalTime={totalTime}
      slug={slug}
      quizType="fill-blanks"
      clearGuestData={clearGuestData}
      isSaving={isSaving}
    >
      <div className="max-w-4xl mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              Quiz Results
              {isSaving && <span className="text-sm text-muted-foreground">(Saving...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-3xl font-bold mb-2">{score.toFixed(1)}%</p>
              <Progress value={score} className="w-full h-2" indicatorClassName={performance.bgColor} />
              <p className="mt-2 text-sm text-muted-foreground">{performance.message}</p>
            </div>

            {/* Debug info - can be removed in production */}
            {answers.length === 0 && (
              <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 font-medium">No answers found to display.</p>
                <p className="text-sm text-amber-700">This may happen if you signed out and back in.</p>
              </div>
            )}

            {results.map((result, index) => (
              <Card key={result.id || index} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Question {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    {result.question.split("_____").map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className={getAnswerClassName(result.similarity)}>{result.userAnswer || "_____"}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <strong className="min-w-[120px]">Your Answer:</strong>
                      <span className={getAnswerClassName(result.similarity)}>
                        {result.userAnswer || "(No answer provided)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="min-w-[120px]">Correct Answer:</strong>
                      <span className="font-bold text-green-600 dark:text-green-400">{result.correctAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="min-w-[120px]">Accuracy:</strong>
                      <span>{result.similarity.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.similarity === 100 ? (
                      <CheckCircle className="text-green-500" />
                    ) : result.similarity > 80 ? (
                      <AlertTriangle className="text-yellow-500" />
                    ) : (
                      <XCircle className="text-red-500" />
                    )}
                    <span>
                      {result.similarity === 100
                        ? "Perfect match!"
                        : result.similarity > 80
                          ? "Close enough!"
                          : "Needs improvement"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Time spent: {Math.floor(result.timeSpent / 60)}m {Math.round(result.timeSpent % 60)}s
                  </p>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-center mt-6">
              <Button onClick={handleRestart} disabled={isSaving}>
                Restart Quiz
              </Button>
            </div>
            {saveError && (
              <p className="text-red-500 text-center mt-4">
                Error saving results: {saveError}. Your progress is still displayed here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </QuizResultBase>
  )
}

function getAnswerClassName(similarity: number): string {
  if (similarity === 100) return "font-bold text-green-600 dark:text-green-400"
  if (similarity > 80) return "font-bold text-yellow-600 dark:text-yellow-400"
  return "font-bold text-red-600 dark:text-red-400"
}
