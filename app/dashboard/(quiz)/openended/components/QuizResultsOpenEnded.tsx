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
import { saveResults, completeQuiz } from "@/store/slices/textQuizSlice" 
import type { QuizResult, QuizAnswer } from "@/types/quiz"

interface QuizResultsOpenEndedProps {
  result: QuizResult
}

interface AnswerWithSimilarity extends QuizAnswer {
  similarity: number;
}

export default function QuizResultsOpenEnded({ result }: QuizResultsOpenEndedProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isRestarting, setIsRestarting] = useState(false)
  const [hasError, setHasError] = useState(false)
  const quizState = useAppSelector((state) => state.textQuiz)

  // Check for errors in result data and ensure state is properly saved
  useEffect(() => {
    try {
      if (!result?.answers?.length || !result?.questions?.length) {
        setHasError(true);
        return;
      }
      
      console.log('Quiz state in results:', {
        status: quizState.status,
        isCompleted: quizState.isCompleted,
        resultsSaved: quizState.resultsSaved,
        answersCount: quizState.answers.length,
      });
      
      // Save results if they haven't been saved yet
      if ((!quizState.resultsSaved || !quizState.isCompleted) && 
          (quizState.status !== 'succeeded' && quizState.status !== 'completed')) {
        
        // Calculate the average score and save it
        const answers = calculateAnswerScores(result.answers, result.questions);
        const avgScore = calculateAverageScore(answers);
        
        // Dispatch both complete and save actions to ensure state is properly updated
        dispatch(completeQuiz({
          answers: result.answers,
          completedAt: result.completedAt || new Date().toISOString(),
        }));
        
        // Then save the results with the calculated score
        setTimeout(() => {
          dispatch(saveResults({ score: avgScore }));
        }, 300);
      }
    } catch (error) {
      console.error('Error initializing results:', error);
      setHasError(true);
    }
  }, [result, quizState, dispatch])

  // Handle restart quiz
  const handleRestart = useCallback(() => {
    setIsRestarting(true)
    router.replace(`/dashboard/openended/${result.slug}?reset=true`)
  }, [result.slug, router])

  // Helper function to calculate similarity scores
  const calculateAnswerScores = (answers: QuizAnswer[], questions: any[]): AnswerWithSimilarity[] => {
    return answers.map((answer, index) => {
      try {
        const question = questions[index] || {}
        const similarity = getBestSimilarityScore(
          answer.answer || '',
          question.answer || ''
        )
        return { ...answer, similarity }
      } catch (error) {
        console.warn('Error calculating similarity:', error)
        return { ...answer, similarity: 0 }
      }
    })
  }

  // Helper function to calculate average score
  const calculateAverageScore = (answerScores: AnswerWithSimilarity[]): number => {
    const validScores = answerScores.filter(score => !isNaN(score.similarity))
    return validScores.length
      ? Math.round(validScores.reduce((sum, answer) => sum + answer.similarity, 0) / validScores.length)
      : 0
  }

  // Calculate stats
  const stats = useMemo(() => {
    try {
      if (!result.answers.length) {
        return {
          totalTime: 0,
          averageTime: 0,
          completionRate: 0,
          averageScore: 0,
          answers: [] as AnswerWithSimilarity[],
        }
      }

      const totalTime = result.answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0)
      const averageTime = result.answers.length ? Math.round(totalTime / result.answers.length) : 0
      const completionRate = Math.round((result.answers.length / Math.max(1, result.totalQuestions)) * 100)
      
      const answers = calculateAnswerScores(result.answers, result.questions)
      const averageScore = calculateAverageScore(answers)

      return {
        totalTime,
        averageTime,
        completionRate,
        averageScore,
        answers,
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
      setHasError(true)
      return {
        totalTime: 0,
        averageTime: 0,
        completionRate: 0,
        averageScore: 0,
        answers: [] as AnswerWithSimilarity[],
      }
    }
  }, [result])

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
        <p className="text-muted-foreground">
          You completed {result.answers.length} out of {result.totalQuestions} questions
        </p>
      </CardHeader>

      {/* Stats Overview */}
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
                <p className="text-sm font-medium">Average Time per Question</p>
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
        <Button
          onClick={handleRestart}
          disabled={isRestarting}
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRestarting ? "Restarting..." : "Try Again"}
        </Button>
      </div>
    </motion.div>
  )
}
