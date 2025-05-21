"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, RefreshCw, Download, Award, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

import { useAppDispatch } from "@/store"
import { completeQuiz } from "@/app/store/slices/textQuizSlice"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { QuizResult } from "@/app/types/quiz-types"
import { QuizAnswer } from "@/types/quiz"

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
  const [activeTab, setActiveTab] = useState("summary")

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

  // Create arrays of all questions and matching answers
  const questionsWithAnswers = useMemo(() => {
    try {
      // Create a list of all questions, answered or not
      const allQuestionsWithAnswers = result.questions.map((question, index) => {
        const matchingAnswer = result.answers.find(a => a.questionId === question.id)
        
        let similarity = 0
        if (matchingAnswer) {
          try {
            similarity = getBestSimilarityScore(matchingAnswer.answer || "", question.answer || "")
          } catch {
            similarity = 0
          }
        }
        
        return {
          question,
          answer: matchingAnswer || null,
          similarity,
          isAnswered: !!matchingAnswer
        }
      })
      
      return allQuestionsWithAnswers
    } catch (err) {
      console.error("Error creating question-answer mapping:", err)
      setHasError(true)
      return []
    }
  }, [result.questions, result.answers])

  const stats = useMemo(() => {
    try {
      const totalAnswers = result.answers?.length || 0
      const totalQuestions = result.questions?.length || 0

      // Calculate total time spent
      const totalTime = totalAnswers > 0 
        ? result.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) 
        : 0
        
      const averageTime = totalAnswers > 0 ? Math.round(totalTime / totalAnswers) : 0
      const completionRate = Math.round((totalAnswers / Math.max(1, totalQuestions)) * 100)

      // Calculate scores only for submitted answers
      const answers = calculateAnswerScores(result.answers, result.questions)
      const averageScore = calculateAverageScore(answers)
      
      // Count questions by score ranges
      const scoreRanges = {
        excellent: answers.filter(a => a.similarity >= 80).length,
        good: answers.filter(a => a.similarity >= 60 && a.similarity < 80).length,
        fair: answers.filter(a => a.similarity >= 40 && a.similarity < 60).length,
        poor: answers.filter(a => a.similarity < 40).length,
        unanswered: totalQuestions - totalAnswers
      }

      return {
        totalTime,
        averageTime,
        completionRate,
        averageScore,
        answers,
        totalAnswers,
        totalQuestions,
        scoreRanges
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
        totalAnswers: 0,
        totalQuestions: 0,
        scoreRanges: { excellent: 0, good: 0, fair: 0, poor: 0, unanswered: 0 }
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
          questions: result.questions,
          slug: result.slug
        })
      );

      setResultsProcessed(true);
    }
  }, [dispatch, result, resultsProcessed, calculateAnswerScores, calculateAverageScore])

  const handleRestart = useCallback(() => {
    setIsRestarting(true)
    router.replace(`/dashboard/openended/${result.slug}?reset=true`)
  }, [result.slug, router])

  const handleSaveResults = useCallback(() => {
    // Create summary text for download
    const summaryText = `
Quiz Results: ${result.title || "Open Ended Quiz"}
Date: ${new Date(result.completedAt).toLocaleString()}
Score: ${stats.averageScore}%
Completion: ${stats.completionRate}%
Time: ${formatQuizTime(stats.totalTime)}

Questions and Answers:
${questionsWithAnswers.map((qa, i) => `
Question ${i+1}: ${qa.question.question}
${qa.isAnswered ? `Your Answer: ${qa.answer?.answer}
Similarity Score: ${qa.similarity}%` : 'Not answered'}
`).join('\n')}
    `.trim()
    
    // Create and download file
    const blob = new Blob([summaryText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz-results-${result.slug || 'openended'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result, stats, questionsWithAnswers])

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

  // Get background color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  // Determine badge color based on similarity score
  const getSimilarityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-500">Excellent ({score}%)</Badge>
    } else if (score >= 60) {
      return <Badge className="bg-yellow-500">Good ({score}%)</Badge>
    } else if (score >= 40) {
      return <Badge className="bg-orange-500">Fair ({score}%)</Badge>
    } else {
      return <Badge className="bg-red-500">Poor ({score}%)</Badge>
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz Results</h1>
          <p className="text-muted-foreground">
            {result.title || "Open Ended Quiz"} • Completed {new Date(result.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveResults} title="Save results">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Results</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestart} disabled={isRestarting} title="Try again">
            <RefreshCw className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">{isRestarting ? "Restarting..." : "Try Again"}</span>
          </Button>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`rounded-full w-16 h-16 flex items-center justify-center text-white text-xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore}%
            </div>
            <div>
              <h3 className="font-medium">Average Score</h3>
              <p className="text-sm text-muted-foreground">Based on similarity to reference answers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{stats.completionRate}%</span>
                    <span className="text-xs text-muted-foreground">
                      {stats.totalAnswers}/{stats.totalQuestions} questions
                    </span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Time Stats</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Total</span>
                    <p className="font-mono text-sm">{formatQuizTime(stats.totalTime)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Average</span>
                    <p className="font-mono text-sm">{formatQuizTime(stats.averageTime)}/q</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for viewing different aspects */}
      <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="summary" className="flex items-center gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2 py-2">
            <Award className="h-4 w-4" />
            <span>All Questions</span>
          </TabsTrigger>
          <TabsTrigger value="answered" className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Answered</span>
          </TabsTrigger>
          <TabsTrigger value="unanswered" className="flex items-center gap-2 py-2">
            <Clock className="h-4 w-4" />
            <span>Unanswered</span>
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Overview of your performance in this quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Excellent</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.excellent}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Good</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.good}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Fair</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.fair}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Needs Work</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.poor}</p>
                      <span className="text-xs">answers</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>All Questions</CardTitle>
              <CardDescription>
                {result.questions.length} questions total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsWithAnswers.map((qa, index) => (
                <div key={qa.question.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    {qa.isAnswered && getSimilarityBadge(qa.similarity)}
                  </div>
                  <p className="text-muted-foreground mb-2">{qa.question.question}</p>
                  
                  {qa.isAnswered ? (
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="text-sm font-medium mb-1">Your Answer:</p>
                      <p className="text-sm">{qa.answer?.answer || "No answer provided"}</p>
                    </div>
                  ) : (
                    <div className="bg-muted/50 p-3 rounded-md mt-2 border border-dashed border-muted-foreground/30">
                      <p className="text-sm italic text-muted-foreground">You didn't answer this question</p>
                    </div>
                  )}
                  
                  {/* Show reference answer button */}
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                      View reference answer
                    </summary>
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <p className="text-sm">{qa.question.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Answered Tab */}
        <TabsContent value="answered">
          <Card>
            <CardHeader>
              <CardTitle>Answered Questions</CardTitle>
              <CardDescription>
                {stats.totalAnswers} questions answered out of {stats.totalQuestions}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsWithAnswers.filter(qa => qa.isAnswered).map((qa, index) => (
                <div key={qa.question.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {questionsWithAnswers.findIndex(q => q.question.id === qa.question.id) + 1}</h3>
                    {getSimilarityBadge(qa.similarity)}
                  </div>
                  <p className="text-muted-foreground mb-2">{qa.question.question}</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Your Answer:</p>
                    <p className="text-sm">{qa.answer?.answer || "No answer provided"}</p>
                  </div>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                      View reference answer
                    </summary>
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <p className="text-sm">{qa.question.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
              
              {questionsWithAnswers.filter(qa => qa.isAnswered).length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p>You haven't answered any questions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unanswered Tab */}
        <TabsContent value="unanswered">
          <Card>
            <CardHeader>
              <CardTitle>Unanswered Questions</CardTitle>
              <CardDescription>
                {stats.totalQuestions - stats.totalAnswers} questions unanswered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsWithAnswers.filter(qa => !qa.isAnswered).map((qa, index) => (
                <div key={qa.question.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {questionsWithAnswers.findIndex(q => q.question.id === qa.question.id) + 1}</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">{qa.question.question}</p>
                  <div className="bg-muted/50 p-3 rounded-md mt-2 border border-dashed border-muted-foreground/30">
                    <p className="text-sm italic text-muted-foreground">You didn't answer this question</p>
                  </div>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                      View reference answer
                    </summary>
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <p className="text-sm">{qa.question.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
              
              {questionsWithAnswers.filter(qa => !qa.isAnswered).length === 0 && (
                <div className="text-center py-10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
                  <p>Great job! You've answered all the questions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button onClick={() => router.push("/dashboard/quizzes")}>Return to Quizzes</Button>
        <Button onClick={handleRestart} disabled={isRestarting} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRestarting ? "Restarting..." : "Try Again"}
        </Button>
      </div>
    </motion.div>
  )
}
