"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Clock, Share2, RefreshCw, Download, Award, BarChart3, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import { useAppDispatch } from "@/store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { QuizResultProps } from "@/app/types/quiz-types"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { resetQuiz } from "@/app/store/slices/textQuizSlice"

export default function BlankQuizResults({ result }: QuizResultProps) {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("summary")
  const [isRestarting, setIsRestarting] = useState(false)

  // Transform incoming data to match expected format
  const formattedResult = useMemo(
    () => ({
      ...result,
      answers: result.answers.map((answer) => ({
        ...answer,
        userAnswer: answer.answer, // Map answer to userAnswer
        correctAnswer: answer.correctAnswer || answer.answer || "",
        isCorrect: answer.isCorrect || false,
        timeSpent: answer.timeSpent || 0,
        hintsUsed: answer.hintsUsed || false,
        similarity: answer.similarity || 0,
      })),
    }),
    [result],
  )

  // Ensure we have a valid result object with default values for tests
  const safeResult = useMemo(
    () => ({
      quizId: formattedResult?.quizId || "",
      slug: formattedResult?.slug || "",
      score: typeof formattedResult?.score === "number" ? formattedResult.score : 0,
      totalQuestions: formattedResult?.totalQuestions || 0,
      correctAnswers: formattedResult?.correctAnswers || 0,
      totalTimeSpent: formattedResult?.totalTimeSpent || 0,
      formattedTimeSpent: formattedResult?.formattedTimeSpent || formatQuizTime(formattedResult?.totalTimeSpent || 0),
      completedAt: formattedResult?.completedAt || new Date().toISOString(),
      answers: Array.isArray(formattedResult?.answers) ? formattedResult.answers.filter(Boolean) : [],
      questions: Array.isArray(formattedResult?.questions) ? formattedResult.questions : [],
      title: formattedResult?.title || "Fill in the Blanks Quiz",
    }),
    [formattedResult],
  )

  // Create question-answer mapping for display
  const questionsWithAnswers = useMemo(() => {
    try {
      // Create a list of all questions, answered or not
      const allQuestionsWithAnswers = safeResult.questions?.map((question, index) => {
        const matchingAnswer = safeResult.answers.find(a => a.questionId === question.id);
        
        return {
          question,
          answer: matchingAnswer || null,
          isAnswered: !!matchingAnswer,
          isCorrect: matchingAnswer?.isCorrect || false
        };
      }) || [];
      
      return allQuestionsWithAnswers;
    } catch (err) {
      console.error("Error creating question-answer mapping:", err);
      return [];
    }
  }, [safeResult.questions, safeResult.answers])

  // Calculate additional stats
  const stats = useMemo(() => {
    const validAnswers = safeResult.answers.filter((a) => a && typeof a === "object")
    const hintsUsedCount = validAnswers.filter((a) => a.hintsUsed).length
    const correctAnswers = validAnswers.filter((a) => a.isCorrect).length
    
    const fastestAnswer =
      validAnswers.length > 0
        ? validAnswers.reduce(
            (fastest, current) => (current.timeSpent < fastest.timeSpent ? current : fastest),
            validAnswers[0],
          )
        : null
        
    const slowestAnswer =
      validAnswers.length > 0
        ? validAnswers.reduce(
            (slowest, current) => (current.timeSpent > slowest.timeSpent ? current : slowest),
            validAnswers[0],
          )
        : null

    const totalTime = validAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0)
    const averageTimePerQuestion = validAnswers.length > 0 ? Math.round(totalTime / validAnswers.length) : 0
    
    // Calculate accuracy for the quiz
    const accuracy = safeResult.totalQuestions > 0
      ? Math.round((correctAnswers / safeResult.totalQuestions) * 100)
      : 0
      
    // Calculate score ranges
    const scoreRanges = {
      correct: correctAnswers,
      incorrect: validAnswers.length - correctAnswers,
      unanswered: safeResult.totalQuestions - validAnswers.length,
      hintsUsed: hintsUsedCount
    }

    return {
      hintsUsedCount,
      hintsUsedPercentage:
        safeResult.totalQuestions > 0 ? Math.round((hintsUsedCount / safeResult.totalQuestions) * 100) : 0,
      accuracy,
      fastestAnswer,
      slowestAnswer,
      totalTime,
      averageTimePerQuestion,
      scoreRanges
    }
  }, [safeResult.answers, safeResult.totalQuestions])

  // Optimize the handleTryAgain function
  const handleTryAgain = useCallback(() => {
    if (isRestarting) return

    setIsRestarting(true)

    // Reset the quiz state in Redux
    dispatch(resetQuiz())

    // Add a timestamp parameter to force a fresh load
    const timestamp = new Date().getTime()
    const url = `/dashboard/blanks/${safeResult.slug}?reset=true&t=${timestamp}`

    // Navigate to the quiz page with reset=true parameter
    setTimeout(() => {
      router.replace(url)
    }, 200)
  }, [dispatch, router, safeResult.slug, isRestarting])

  const handleSaveResults = useCallback(() => {
    // Create summary text for download
    const summaryText = `
Fill in the Blanks Quiz Results: ${safeResult.title}
Date: ${new Date(safeResult.completedAt).toLocaleString()}
Score: ${safeResult.correctAnswers}/${safeResult.totalQuestions} (${Math.round((safeResult.correctAnswers / Math.max(1, safeResult.totalQuestions)) * 100)}%)
Time: ${formatQuizTime(stats.totalTime)}

Questions and Answers:
${questionsWithAnswers.map((qa, i) => `
Question ${i+1}: ${qa.question.question.replace(/\[\[(.*?)\]\]/g, "________")}
${qa.isAnswered ? `Your Answer: ${qa.answer?.answer}
Correct Answer: ${qa.answer?.correctAnswer}
Result: ${qa.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}` : 'Not answered'}
`).join('\n')}
    `.trim()
    
    // Create and download file
    const blob = new Blob([summaryText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz-results-${safeResult.slug || 'blanks'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [safeResult, stats.totalTime, questionsWithAnswers])

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Quiz Results",
          text: `I scored ${Math.round((safeResult.correctAnswers / Math.max(1, safeResult.totalQuestions)) * 100)}% on the ${safeResult.slug} quiz!`,
          url: window.location.href,
        })
        toast({
          title: "Shared successfully!",
          description: "Your results have been shared.",
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied!",
          description: "Share your results with friends",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }, [safeResult, toast])

  // Format question text to show the blank
  const formatQuestionText = useCallback((questionText: string) => {
    return questionText.replace(/\[\[(.*?)\]\]/g, (_, p1) => {
      return `<span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">________</span>`
    })
  }, [])

  // Determine badge color based on result
  const getResultBadge = (isCorrect: boolean) => {
    return isCorrect ? 
      <Badge className="bg-green-500">Correct</Badge> : 
      <Badge className="bg-red-500">Incorrect</Badge>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quiz Results</h1>
          <p className="text-muted-foreground">
            {safeResult.title} • Completed {new Date(safeResult.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveResults} title="Save results">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Results</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleTryAgain} disabled={isRestarting} title="Try again">
            <RefreshCw className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">{isRestarting ? "Restarting..." : "Try Again"}</span>
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`rounded-full w-16 h-16 flex items-center justify-center text-white text-xl font-bold ${
              stats.accuracy >= 80 ? "bg-green-500" : 
              stats.accuracy >= 60 ? "bg-yellow-500" : 
              stats.accuracy >= 40 ? "bg-orange-500" : "bg-red-500"
            }`}>
              {stats.accuracy}%
            </div>
            <div>
              <h3 className="font-medium">Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                {safeResult.correctAnswers} of {safeResult.totalQuestions} correct
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{Math.round((safeResult.answers.length / Math.max(1, safeResult.totalQuestions)) * 100)}%</span>
                    <span className="text-xs text-muted-foreground">
                      {safeResult.answers.length}/{safeResult.totalQuestions} questions
                    </span>
                  </div>
                  <Progress value={(safeResult.answers.length / Math.max(1, safeResult.totalQuestions)) * 100} className="h-2" />
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
                    <p className="font-mono text-sm">{formatQuizTime(stats.averageTimePerQuestion)}/q</p>
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
          <TabsTrigger value="correct" className="flex items-center gap-2 py-2">
            <CheckCircle className="h-4 w-4" />
            <span>Correct</span>
          </TabsTrigger>
          <TabsTrigger value="incorrect" className="flex items-center gap-2 py-2">
            <XCircle className="h-4 w-4" />
            <span>Incorrect</span>
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
                    <p className="text-xs text-muted-foreground">Correct</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.correct}</p>
                      <span className="text-xs">questions</span>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.incorrect}</p>
                      <span className="text-xs">questions</span>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Hints Used</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.hintsUsed}</p>
                      <span className="text-xs">questions</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Unanswered</p>
                    <div className="flex gap-1 items-baseline">
                      <p className="text-2xl font-bold">{stats.scoreRanges.unanswered}</p>
                      <span className="text-xs">questions</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>All Questions</CardTitle>
              <CardDescription>
                {safeResult.totalQuestions} questions total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsWithAnswers.map((qa, index) => (
                <div key={qa.question.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    {qa.isAnswered ? getResultBadge(qa.isCorrect) : (
                      <Badge variant="outline" className="text-muted-foreground">Not answered</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2" 
                     dangerouslySetInnerHTML={{ __html: formatQuestionText(qa.question.question) }}></p>
                  
                  {qa.isAnswered ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Your Answer:</span>
                        <div className="bg-muted p-3 rounded-md mt-1">
                          <p className="text-sm">{qa.answer?.answer || "No answer provided"}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Correct Answer:</span>
                        <div className={`p-3 rounded-md mt-1 ${qa.isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                          <p className="text-sm">{qa.answer?.correctAnswer || qa.question.answer}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 p-3 rounded-md mt-2 border border-dashed border-muted-foreground/30">
                      <p className="text-sm italic text-muted-foreground">You didn't provide an answer for this question</p>
                      <p className="text-xs text-muted-foreground mt-2">Correct answer: <span className="font-medium">{qa.question.answer}</span></p>
                    </div>
                  )}
                  
                  {qa.answer?.hintsUsed && (
                    <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded text-xs">
                      <span>Hint was used</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Correct Tab */}
        <TabsContent value="correct">
          <Card>
            <CardHeader>
              <CardTitle>Correct Answers</CardTitle>
              <CardDescription>
                {stats.scoreRanges.correct} of {safeResult.totalQuestions} questions answered correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsWithAnswers.filter(qa => qa.isAnswered && qa.isCorrect).map((qa, index) => (
                <div key={qa.question.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {questionsWithAnswers.findIndex(q => q.question.id === qa.question.id) + 1}</h3>
                    <Badge className="bg-green-500">Correct</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2"
                     dangerouslySetInnerHTML={{ __html: formatQuestionText(qa.question.question) }}></p>
                  <div className="grid grid-cols-1 gap-4 mt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Your Answer:</span>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md mt-1">
                        <p className="text-sm">{qa.answer?.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {questionsWithAnswers.filter(qa => qa.isAnswered && qa.isCorrect).length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <XCircle className="mx-auto h-8 w-8 mb-2 text-red-500" />
                  <p>You didn't answer any questions correctly. Try again!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incorrect Tab */}
        <TabsContent value="incorrect">
          <Card>
            <CardHeader>
              <CardTitle>Incorrect Answers</CardTitle>
              <CardDescription>
                {stats.scoreRanges.incorrect + stats.scoreRanges.unanswered} of {safeResult.totalQuestions} questions answered incorrectly or skipped
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsWithAnswers.filter(qa => !qa.isCorrect).map((qa, index) => (
                <div key={qa.question.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Question {questionsWithAnswers.findIndex(q => q.question.id === qa.question.id) + 1}</h3>
                    {qa.isAnswered ? (
                      <Badge className="bg-red-500">Incorrect</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not answered</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2"
                     dangerouslySetInnerHTML={{ __html: formatQuestionText(qa.question.question) }}></p>
                  
                  {qa.isAnswered ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Your Answer:</span>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md mt-1">
                          <p className="text-sm">{qa.answer?.answer}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Correct Answer:</span>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md mt-1">
                          <p className="text-sm">{qa.answer?.correctAnswer || qa.question.answer}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 p-3 rounded-md mt-2 border border-dashed border-muted-foreground/30">
                      <p className="text-sm italic text-muted-foreground">You didn't provide an answer for this question</p>
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Correct answer:</span>
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md mt-1">
                          <p className="text-sm">{qa.question.answer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {questionsWithAnswers.filter(qa => !qa.isCorrect).length === 0 && (
                <div className="text-center py-10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
                  <p>Great job! You answered all questions correctly!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button onClick={() => router.push("/dashboard/quizzes")}>Return to Quizzes</Button>
        <Button onClick={handleTryAgain} disabled={isRestarting} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRestarting ? "Restarting..." : "Try Again"}
        </Button>
      </div>
    </motion.div>
  )
}
