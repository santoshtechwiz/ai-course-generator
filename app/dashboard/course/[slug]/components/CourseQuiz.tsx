"use client"

import { useCallback, useMemo, useEffect, useReducer } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-helper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks"
import { useSession } from "next-auth/react"
import { AccessControl } from "@/components/ui/access-control"
import { AlertCircle, CheckCircle, BookOpen, Lightbulb, XCircle, Award, BarChart3, RotateCcw, Home, Download } from "lucide-react" // Added Award
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { storageManager } from "@/utils/storage-manager"
import { useProgressEvents } from "@/utils/progress-events"
import { selectQuizProgressFromEvents, selectCurrentQuizAnswers } from "@/store/slices/progress-events-slice"
import { useAppSelector } from "@/store/hooks"
import { QuizProgress } from "@/utils/storage-manager"

import type { CourseQuestion, FullChapterType, FullCourseType } from "@/app/types/types"
import type { AccessLevels } from "./CourseDetailsTabs"

interface QuizProps {
  chapter: FullChapterType
  course: FullCourseType
  isPublicCourse: boolean
  chapterId?: string
  accessLevels: AccessLevels
}

interface QuizState {
  answers: Record<string, string>
  currentQuestionIndex: number
  quizCompleted: boolean
  score: number
  showResults: boolean
  quizStarted: boolean
  quizProgress: Record<string, any>
}

type QuizAction =
  | { type: "SET_ANSWER"; questionId: string; answer: string }
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE_QUIZ"; score: number }
  | { type: "SHOW_RESULTS" }
  | { type: "START_QUIZ" }
  | { type: "RESET_QUIZ" }
  | { type: "LOAD_PROGRESS"; progress: Record<string, any> }

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
      }
    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      }
    case "COMPLETE_QUIZ":
      return {
        ...state,
        quizCompleted: true,
        score: action.score,
      }
    case "SHOW_RESULTS":
      return { ...state, showResults: true }
    case "START_QUIZ":
      return { ...state, quizStarted: true }
    case "RESET_QUIZ":
      return {
        answers: {},
        currentQuestionIndex: 0,
        quizCompleted: false,
        score: 0,
        showResults: false,
        quizStarted: false,
        quizProgress: {},
      }
    case "LOAD_PROGRESS":
      return {
        ...state,
        quizProgress: action.progress,
        ...(action.progress.completed && {
          quizCompleted: true,
          score: action.progress.score || 0,
          answers: action.progress.answers || {},
        }),
        ...(action.progress.currentIndex !== undefined && {
          currentQuestionIndex: action.progress.currentIndex,
          answers: action.progress.answers || {},
          quizStarted: true,
        }),
      }
    default:
      return state
  }
}

const QuizSkeleton = () => (
  <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-purple-200 dark:border-purple-900">
    <CardContent className="p-8 space-y-6">
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </CardContent>
  </Card>
)

export default function CourseDetailsQuiz({ chapter, course, isPublicCourse, chapterId, accessLevels }: QuizProps) {
  // Quiz should only be available to subscribed users (not just authenticated)
  const hasQuizAccess = accessLevels.isSubscribed || chapter?.isFree === true || (chapter as any)?.isFreeQuiz === true
  const { toast } = useToast()
  const { data: session } = useSession()
  const isUserAuthenticated = accessLevels.isAuthenticated || !!session
  const effectiveChapterId = chapterId || chapter?.id?.toString()
  const canFetchQuestions = hasQuizAccess

  // Use event-driven progress system
  const { dispatchQuizStarted, dispatchQuestionAnswered, dispatchQuizCompleted } = useProgressEvents()
  const userId = session?.user?.id || ''

  // Get quiz progress from event log
  const quizProgress = useAppSelector((state) => selectQuizProgressFromEvents(state))
  const currentAnswers = useAppSelector((state) => selectCurrentQuizAnswers(state, effectiveChapterId || ''))

  const initialQuizState: QuizState = {
    answers: {},
    currentQuestionIndex: 0,
    quizCompleted: false,
    score: 0,
    showResults: false,
    quizStarted: false,
    quizProgress: {},
  }

  const [quizState, dispatch] = useReducer(quizReducer, initialQuizState)

  // Reset quiz state when chapter changes
  useEffect(() => {
    dispatch({ type: "RESET_QUIZ" })
  }, [effectiveChapterId])

  const demoQuestions = useMemo(
    () => [
      {
        id: "obs-1",
        question: "How would you best describe an Observable in reactive programming?",
        options: ["stream of Click events", "object function", "data storage detail", "sequence of Click events"],
        answer: "stream of Click events",
      },
    ],
    [],
  )

  useEffect(() => {
    if (effectiveChapterId && course?.id) {
      try {
        const progress = storageManager.getQuizProgress(String(course.id), effectiveChapterId)
        if (progress) {
          dispatch({ type: "LOAD_PROGRESS", progress: {
            answers: progress.answers,
            currentQuestionIndex: progress.currentQuestionIndex,
            lastUpdated: new Date(progress.lastUpdated).toISOString()
          } })
        }
      } catch (e) {
        console.error("Failed to load quiz progress", e)
      }
    }
  }, [effectiveChapterId, course?.id])

  const saveProgress = useCallback(
    (data: Record<string, any>) => {
      if (!effectiveChapterId || !course?.id) return
      try {
        const progress: QuizProgress = {
          courseId: String(course.id),
          chapterId: effectiveChapterId,
          currentQuestionIndex: data.currentQuestionIndex || quizState.currentQuestionIndex,
          answers: { ...quizState.quizProgress.answers, ...data.answers },
          timeSpent: data.timeSpent || 0,
          lastUpdated: Date.now(),
          isCompleted: data.isCompleted || false
        }
        storageManager.saveQuizProgress(progress)
      } catch (e) {
        console.error("Failed to save quiz progress", e)
      }
    },
    [quizState.quizProgress, quizState.currentQuestionIndex, effectiveChapterId, course?.id],
  )

  const {
    data: questions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CourseQuestion[]>({
    queryKey: ["chapter-quiz", effectiveChapterId],
    queryFn: async () => {
      if (!chapter?.videoId || !effectiveChapterId) throw new Error("Missing chapter data")

      const response = await api.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      return response.map((q: any) => ({
        ...q,
        id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
        options: Array.isArray(q.options)
          ? q.options
          : typeof q.options === "string"
            ? (() => {
                try {
                  return JSON.parse(q.options)
                } catch {
                  return []
                }
              })()
            : q.options
              ? [q.options]
              : [],
      }))
    },
    enabled: !!effectiveChapterId && quizState.quizStarted && canFetchQuestions,
    retry: 2,
  })

  // Handle query errors with toast
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Failed to load quiz",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }, [isError, error, toast])

  const effectiveQuestions: CourseQuestion[] = useMemo(() => {
    if (!isUserAuthenticated) return demoQuestions
    return questions && Array.isArray(questions) && questions.length > 0 ? questions : []
  }, [isUserAuthenticated, questions, demoQuestions])

  const currentQuestion = effectiveQuestions[quizState.currentQuestionIndex] || null

  const startQuiz = useCallback(() => {
    dispatch({ type: "START_QUIZ" })
    saveProgress({ started: true, startedAt: new Date().toISOString() })
    refetch()

    // Dispatch quiz started event
    if (userId && effectiveChapterId && course?.id) {
      dispatchQuizStarted(
        userId,
        effectiveChapterId,
        'mcq', // Default quiz type
        course.slug || '',
        effectiveQuestions.length
      )
    }
  }, [saveProgress, refetch, dispatchQuizStarted, userId, effectiveChapterId, course?.id, course?.slug, effectiveQuestions.length])

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return
    dispatch({ type: "SET_ANSWER", questionId: String(currentQuestion.id), answer: value })
    saveProgress({ answers: { ...quizState.answers, [String(currentQuestion.id)]: value } })

    // Dispatch question answered event
    if (userId && effectiveChapterId && currentQuestion) {
      const correctAnswer = currentQuestion.answer?.trim() || ''
      const isCorrect = value.trim().toLowerCase() === correctAnswer.toLowerCase()
      
      dispatchQuestionAnswered(
        userId,
        String(currentQuestion.id),
        effectiveChapterId,
        quizState.currentQuestionIndex,
        undefined, // selectedOptionId
        value,
        isCorrect,
        0 // timeSpent - could be enhanced later
      )
    }
  }

  const handleNextQuestion = () => {
    if (quizState.currentQuestionIndex < effectiveQuestions.length - 1) {
      dispatch({ type: "NEXT_QUESTION" })
      saveProgress({ currentIndex: quizState.currentQuestionIndex + 1 })
    }
  }

  const submitAnswer = () => {
    const userAnswer = quizState.answers[currentQuestion.id]
    const isCorrect = userAnswer?.trim() === currentQuestion.answer?.trim()
    const newScore = isCorrect ? quizState.score + 1 : quizState.score

    if (quizState.currentQuestionIndex < effectiveQuestions.length - 1) {
      // Don't auto-advance, just mark as answered
      saveProgress({
        answers: { ...quizState.answers, [currentQuestion.id]: userAnswer },
        currentIndex: quizState.currentQuestionIndex
      })
    } else {
      // Last question - complete the quiz
      dispatch({ type: "COMPLETE_QUIZ", score: newScore })
      saveProgress({
        completed: true,
        score: newScore,
        answers: { ...quizState.answers, [currentQuestion.id]: userAnswer }
      })

      // Update progress with the new queue system
      const accuracy = (newScore / effectiveQuestions.length) * 100
      dispatchQuizCompleted(userId, effectiveChapterId, course.id, newScore, effectiveQuestions.length, Date.now(), {
        ...Object.entries(quizState.answers).map(([questionId, answer]) => ({
          questionId,
          isCorrect: answer?.trim() === effectiveQuestions.find(q => q.id === questionId)?.answer?.trim(),
          timeSpent: 0, // TODO: Add time tracking
        })),
        chapterId: chapter?.id || 0,
        score: newScore,
        accuracy,
        timeSpent: 0, // You might want to track actual time spent
        completed: true,
        passed: newScore >= Math.ceil(effectiveQuestions.length * 0.7) // 70% passing score
      })

      // Dispatch quiz completed event
      if (userId && effectiveChapterId) {
        const answers = Object.values(quizState.answers).map((answer: any) => ({
          questionId: String(answer.questionId || ''),
          isCorrect: answer.isCorrect || false,
          timeSpent: answer.timeSpent || 0
        }))

        dispatchQuizCompleted(
          userId,
          effectiveChapterId,
          newScore,
          effectiveQuestions.length,
          (newScore / effectiveQuestions.length) * 100,
          0, // totalTimeSpent - could be enhanced later
          answers
        )
      }

      toast({
        title: "Quiz Complete",
        description: `You scored ${newScore}/${effectiveQuestions.length}`
      })
    }
  }

  const retakeQuiz = () => {
    dispatch({ type: "RESET_QUIZ" })
    saveProgress({ completed: false, currentIndex: 0, answers: {}, score: 0 })
  }

  const startContent = (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-purple-200 dark:border-purple-900">
      <CardContent className="text-center py-12 px-6 bg-purple-50/30 dark:bg-purple-950/20 rounded-b-xl">
        <Lightbulb className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-4 text-purple-800 dark:text-purple-200">
          Ready to test your knowledge?
        </h2>
        <p className="text-muted-foreground mb-6">
          This quiz will help you reinforce what you've learned in this chapter.
        </p>
        <Button onClick={startQuiz} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
          Start Quiz
        </Button>
      </CardContent>
    </Card>
  )

  const activeQuizContent = currentQuestion && (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-purple-200 dark:border-purple-900">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-purple-800 dark:text-purple-200">
          <BookOpen className="h-6 w-6 text-purple-500 dark:text-purple-300" />
          {/* Question counter removed for cleaner layout */}
        </CardTitle>
        <p className="text-lg font-medium mt-4 text-foreground">{currentQuestion.question}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6 bg-purple-50/30 dark:bg-purple-950/20 rounded-b-xl">
        <RadioGroup value={quizState.answers[String(currentQuestion.id)] || ""} onValueChange={handleAnswer}>
          {Array.isArray(currentQuestion.options) && currentQuestion.options.map((opt: string, idx: number) => (
            <div
              key={idx}
              className="flex items-center space-x-3 p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-800 transition-all duration-200 cursor-pointer"
            >
              <RadioGroupItem value={opt} id={`option-${idx}`} className="text-purple-600" />
              <Label htmlFor={`option-${idx}`} className="cursor-pointer text-base flex-1">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={submitAnswer}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!quizState.answers[String(currentQuestion.id)]}
          >
            Submit Answer
          </Button>

          {quizState.currentQuestionIndex < effectiveQuestions.length - 1 && quizState.answers[currentQuestion.id] && (
            <Button
              onClick={handleNextQuestion}
              variant="outline"
              className="px-6 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950"
            >
              Next Question
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const resultsContent = (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-xl border border-purple-200 dark:border-purple-900 overflow-hidden">
      <CardHeader className="p-8 pb-6 bg-gradient-to-r from-purple-50/50 via-purple-25/30 to-purple-50/50 dark:from-purple-950/30 dark:via-purple-900/20 dark:to-purple-950/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-full">
              <Award className="h-8 w-8 text-purple-600 dark:text-purple-300" />
            </div>
            <CardTitle className="text-3xl font-bold text-purple-800 dark:text-purple-200">
              Quiz Completed!
            </CardTitle>
          </div>

          {/* Score Display */}
          <div className="bg-white/80 dark:bg-purple-950/50 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50 shadow-sm">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-2">
              {quizState.score} out of {effectiveQuestions.length}
            </div>
            <div className="text-lg text-muted-foreground mb-3">
              {Math.round((quizState.score / effectiveQuestions.length) * 100)}% Correct
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(quizState.score / effectiveQuestions.length) * 100}%` }}
              />
            </div>

            {/* Performance Message */}
            <div className="text-sm font-medium">
              {quizState.score === effectiveQuestions.length ? (
                <span className="text-green-600 dark:text-green-400">🎉 Perfect! Excellent work!</span>
              ) : quizState.score >= effectiveQuestions.length * 0.8 ? (
                <span className="text-blue-600 dark:text-blue-400">👏 Great job! Well done!</span>
              ) : quizState.score >= effectiveQuestions.length * 0.6 ? (
                <span className="text-yellow-600 dark:text-yellow-400">👍 Good effort! Keep learning!</span>
              ) : (
                <span className="text-orange-600 dark:text-orange-400">📚 Keep practicing! You've got this!</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 bg-purple-50/30 dark:bg-purple-950/20">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Review Your Answers
          </h3>

          {effectiveQuestions.map((q: CourseQuestion, index: number) => {
            const userAnswer = quizState.answers[q.id]
            const isCorrect = userAnswer?.trim() === q.answer?.trim()
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-6 rounded-xl border-2 shadow-sm transition-all duration-200",
                  isCorrect
                    ? "border-green-300 bg-green-50/80 dark:bg-green-900/20 dark:border-green-700"
                    : "border-red-300 bg-red-50/80 dark:bg-red-900/20 dark:border-red-700",
                )}
              >
                <h4 className="font-semibold text-lg flex items-start gap-3 mb-4">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <span className="text-purple-800 dark:text-purple-200 leading-relaxed">
                    {index + 1}. {q.question}
                  </span>
                </h4>

                <div className="ml-11 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-sm text-muted-foreground min-w-[100px]">Your answer:</span>
                    <span className={cn(
                      "text-sm font-medium",
                      isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                    )}>
                      {userAnswer || "No answer selected"}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-sm text-muted-foreground min-w-[100px]">Correct answer:</span>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {q.answer}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>

      {/* Action Buttons - Redesigned with better alignment */}
      <CardContent className="p-8 bg-gradient-to-r from-purple-100/50 via-purple-50/30 to-purple-100/50 dark:from-purple-900/30 dark:via-purple-950/20 dark:to-purple-900/30 border-t border-purple-200/50 dark:border-purple-700/50">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={retakeQuiz}
            size="lg"
            className="flex-1 sm:flex-none min-w-[200px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none min-w-[200px] border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Course
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none min-w-[200px] border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Print Results
          </Button>
        </div>

        {/* Additional Stats */}
        <div className="mt-6 pt-6 border-t border-purple-200/50 dark:border-purple-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-white/60 dark:bg-purple-950/40 rounded-lg p-4 border border-purple-200/30 dark:border-purple-700/30">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{effectiveQuestions.length}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            <div className="bg-white/60 dark:bg-purple-950/40 rounded-lg p-4 border border-purple-200/30 dark:border-purple-700/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{quizState.score}</div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>
            <div className="bg-white/60 dark:bg-purple-950/40 rounded-lg p-4 border border-purple-200/30 dark:border-purple-700/30">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round((quizState.score / effectiveQuestions.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const errorContent = (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-red-200 dark:border-red-900">
      <CardContent className="text-red-500 flex flex-col items-center gap-3 p-8 bg-red-50/30 dark:bg-red-950/20 rounded-b-xl">
        <AlertCircle className="w-10 h-10 text-red-600" />
        <p className="text-lg font-medium">Error loading quiz: {(error as Error)?.message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 bg-transparent">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )

  const content = isError ? (
    errorContent
  ) : isLoading ? (
    <QuizSkeleton />
  ) : !quizState.quizStarted ? (
    startContent
  ) : quizState.quizCompleted ? (
    resultsContent
  ) : (
    activeQuizContent
  )

  return (
    <AccessControl hasAccess={hasQuizAccess} featureTitle="Premium Quiz Feature" showPreview={isPublicCourse}>
      {content}
    </AccessControl>
  )
}
