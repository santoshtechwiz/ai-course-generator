"use client"

import { useCallback, useMemo, useEffect, useReducer } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks"
import { useSession } from "next-auth/react"
import { AccessControl } from "@/components/ui/access-control"
import { AlertCircle, CheckCircle, BookOpen, Lightbulb, XCircle, Award } from "lucide-react" // Added Award
import { cn } from "@/lib/tailwindUtils"

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
  const hasQuizAccess = accessLevels.isSubscribed || accessLevels.isAuthenticated || accessLevels.isPublic
  const { toast } = useToast()
  const { data: session } = useSession()
  const isUserAuthenticated = accessLevels.isAuthenticated || !!session
  const effectiveChapterId = chapterId || chapter?.id?.toString()

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
    if (effectiveChapterId) {
      try {
        const saved = localStorage.getItem(`quiz-progress-${effectiveChapterId}`)
        if (saved) dispatch({ type: "LOAD_PROGRESS", progress: JSON.parse(saved) })
      } catch (e) {
        console.error("Failed to load quiz progress", e)
      }
    }
  }, [effectiveChapterId])

  const saveProgress = useCallback(
    (data: Record<string, any>) => {
      if (!effectiveChapterId) return
      try {
        localStorage.setItem(
          `quiz-progress-${effectiveChapterId}`,
          JSON.stringify({ ...quizState.quizProgress, ...data, lastUpdated: new Date().toISOString() }),
        )
      } catch (e) {
        console.error("Failed to save quiz progress", e)
      }
    },
    [quizState.quizProgress, effectiveChapterId],
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

      const response = await axios.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      return response.data.map((q: any) => ({
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
    enabled: !!effectiveChapterId && quizState.quizStarted && isUserAuthenticated,
    retry: 2,
    onError: () => {
      toast({
        title: "Failed to load quiz",
        description: "Please try again later.",
        variant: "destructive",
      })
    },
  })

  const effectiveQuestions = useMemo(() => {
    if (!isUserAuthenticated) return demoQuestions
    return questions && questions.length > 0 ? questions : []
  }, [isUserAuthenticated, questions, demoQuestions])

  const currentQuestion = effectiveQuestions[quizState.currentQuestionIndex] || null

  const startQuiz = useCallback(() => {
    dispatch({ type: "START_QUIZ" })
    saveProgress({ started: true, startedAt: new Date().toISOString() })
    refetch()
  }, [saveProgress, refetch])

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return
    dispatch({ type: "SET_ANSWER", questionId: currentQuestion.id, answer: value })
    saveProgress({ answers: { ...quizState.answers, [currentQuestion.id]: value } })
  }

  const submitAnswer = () => {
    const userAnswer = quizState.answers[currentQuestion.id]
    const isCorrect = userAnswer?.trim() === currentQuestion.answer?.trim()
    const newScore = isCorrect ? quizState.score + 1 : quizState.score

    if (quizState.currentQuestionIndex < effectiveQuestions.length - 1) {
      dispatch({ type: "NEXT_QUESTION" })
      saveProgress({ currentIndex: quizState.currentQuestionIndex + 1 })
    } else {
      dispatch({ type: "COMPLETE_QUIZ", score: newScore })
      saveProgress({ completed: true, score: newScore })
      toast({ title: "Quiz Complete", description: `You scored ${newScore}/${effectiveQuestions.length}` })
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
          <span>
            Question {quizState.currentQuestionIndex + 1} of {effectiveQuestions.length}
          </span>
        </CardTitle>
        <p className="text-lg font-medium mt-4 text-foreground">{currentQuestion.question}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6 bg-purple-50/30 dark:bg-purple-950/20 rounded-b-xl">
        <RadioGroup value={quizState.answers[currentQuestion.id] || ""} onValueChange={handleAnswer}>
          {currentQuestion.options.map((opt: string, idx: number) => (
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
        <Button
          onClick={submitAnswer}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
          disabled={!quizState.answers[currentQuestion.id]}
        >
          {quizState.currentQuestionIndex < effectiveQuestions.length - 1 ? "Submit & Continue" : "Submit & Finish"}
        </Button>
      </CardContent>
    </Card>
  )

  const resultsContent = (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-purple-200 dark:border-purple-900">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-purple-800 dark:text-purple-200">
          <Award className="h-6 w-6 text-purple-500 dark:text-purple-300" />
          <span>Quiz Completed!</span>
        </CardTitle>
        <p className="text-lg text-muted-foreground mt-2">
          You scored{" "}
          <span className="font-bold text-purple-700 dark:text-purple-300">
            {quizState.score} out of {effectiveQuestions.length}
          </span>
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-6 bg-purple-50/30 dark:bg-purple-950/20 rounded-b-xl">
        {effectiveQuestions.map((q, index) => {
          const userAnswer = quizState.answers[q.id]
          const isCorrect = userAnswer?.trim() === q.answer?.trim()
          return (
            <div
              key={q.id}
              className={cn(
                "p-4 rounded-lg border-2",
                isCorrect
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                  : "border-red-400 bg-red-50 dark:bg-red-900/20",
              )}
            >
              <h4 className="font-medium text-lg flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {index + 1}. {q.question}
              </h4>
              <p className="mt-2 text-base">
                <span className="font-semibold">Your answer: </span>
                <span className={isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                  {userAnswer || "No answer"}
                </span>
              </p>
              {!isCorrect && (
                <p className="mt-1 text-base">
                  <span className="font-semibold">Correct answer: </span>
                  <span className="text-green-700 dark:text-green-300">{q.answer}</span>
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
      <CardContent className="text-center p-6 bg-purple-50/30 dark:bg-purple-950/20 rounded-b-xl">
        <Button onClick={retakeQuiz} className="bg-purple-600 hover:bg-purple-700 text-white">
          Retake Quiz
        </Button>
      </CardContent>
    </Card>
  )

  const errorContent = (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-red-200 dark:border-red-900">
      <CardContent className="text-red-500 flex flex-col items-center gap-3 p-8 bg-red-50/30 dark:bg-red-950/20 rounded-b-xl">
        <AlertCircle className="w-10 h-10 text-red-600" />
        <p className="text-lg font-medium">Error loading quiz: {(error as Error)?.message}</p>
        <Button onClick={refetch} variant="outline" className="mt-4 bg-transparent">
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
