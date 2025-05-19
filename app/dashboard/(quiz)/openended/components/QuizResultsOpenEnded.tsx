"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector, useAppDispatch } from "@/store"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { completeQuiz } from "@/app/store/slices/textQuizSlice"
import type { QuizResult, QuizAnswer } from "@/types/quiz"

interface QuizResultsOpenEndedProps {
  result: QuizResult
}

interface AnswerWithSimilarity extends QuizAnswer {
  similarity: number
}

export default function QuizResultsOpenEnded({ result }: QuizResultsOpenEndedProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isRestarting, setIsRestarting] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [resultsProcessed, setResultsProcessed] = useState(false)

  const quizState = useAppSelector((state) => state.textQuiz)

  // Calculate similarity scores
  const calculateAnswerScores = useCallback(
    (answers: QuizAnswer[], questions: any[]): AnswerWithSimilarity[] => {
      return answers.map((answer, index) => {
        try {
          const question = questions[index] || {}
          const similarity = getBestSimilarityScore(answer.answer || "", question.answer || "")
          return { ...answer, similarity }
        } catch {
          return { ...answer, similarity: 0 }
        }
      })
    },
    []
  )

  const calculateAverageScore = useCallback((answerScores: AnswerWithSimilarity[]) => {
    const validScores = answerScores.filter((score) => !isNaN(score.similarity))
    return validScores.length
      ? Math.round(validScores.reduce((sum, ans) => sum + ans.similarity, 0) / validScores.length)
      : 0
  }, [])

  const stats = useMemo(() => {
    try {
      const totalAnswers = result.answers?.length || 0

      if (totalAnswers === 0) {
        return {
          totalTime: 0,
          averageTime: 0,
          completionRate: 0,
          averageScore: 0,
          answers: [] as AnswerWithSimilarity[],
        }
      }

      const totalTime = result.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
      const averageTime = totalAnswers ? Math.round(totalTime / totalAnswers) : 0
      const completionRate = Math.round((totalAnswers / Math.max(1, result.totalQuestions)) * 100)

      const answers = calculateAnswerScores(result.answers, result.questions)
      const averageScore = calculateAverageScore(answers)

      return {
        totalTime,
        averageTime,
        completionRate,
        averageScore,
        answers,
      }
    } catch (err) {
      console.error("Error calculating stats", err)
      setHasError(true)
      return {
        totalTime: 0,
        averageTime: 0,
        completionRate: 0,
        averageScore: 0,
        answers: [] as AnswerWithSimilarity[],
      }
    }
  }, [result, calculateAnswerScores, calculateAverageScore])

  useEffect(() => {
    if (!result?.questions?.length) {
      console.error("Missing questions in result:", result);
      setHasError(true);
      return;
    }

    if (!resultsProcessed) {
      const answers = result.answers?.length
        ? calculateAnswerScores(result.answers, result.questions)
        : [];
      const avgScore = answers.length ? calculateAverageScore(answers) : 0;

      dispatch(
        completeQuiz({
          answers: result.answers || [],
          completedAt: result.completedAt || new Date().toISOString(),
          score: avgScore,
          quizId: result.quizId || "",
          title: result.title || "Open Ended Quiz",
          questions: result.questions, // Store questions in state for future reference
          slug: result.slug // Store slug for validation
        })
      );

      setResultsProcessed(true);
    }
  }, [dispatch, result, resultsProcessed, calculateAnswerScores, calculateAverageScore])

  const handleRestart = useCallback(() => {
    setIsRestarting(true)
    router.replace(`/dashboard/openended/${result.slug}?reset=true`)
  }, [result.slug, router])

  if (hasError) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold mb-4">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          We encountered an error while loading your quiz results. Please try again later.
        </p>
        <Button onClick={() => router.refresh()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
        <p className="text-muted-foreground">
          You completed {result.answers.length} out of {result.totalQuestions} questions
        </p>
      </CardHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Avg Time per Question</p>
                <p className="text-2xl font-bold">{formatQuizTime(stats.averageTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answer Review */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {stats.answers.map((answer, index) => (
            <div key={answer.questionId} className="border-b last:border-0 pb-4 last:pb-0">
              <h3 className="font-medium mb-2">Question {index + 1}</h3>
              <p className="text-muted-foreground mb-2">{result.questions[index].question}</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">{answer.answer}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs">Similarity Score:</span>
                  <span className="text-xs font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                    {answer.similarity}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={() => router.push("/dashboard/quizzes")}>Return to Quizzes</Button>
        <Button onClick={handleRestart} disabled={isRestarting} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRestarting ? "Restarting..." : "Try Again"}
        </Button>
      </div>
    </motion.div>
  )
}
