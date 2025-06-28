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
import { AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"

import type { CourseQuestion, FullChapterType, FullCourseType } from "@/app/types/types"
import { AccessLevels } from "./CourseDetailsTabs"


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
  <Card className="w-full max-w-4xl mx-auto">
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

export default function CourseDetailsQuiz({
  chapter,
  course,
 
  isPublicCourse,
  chapterId,
  accessLevels
}: QuizProps) {
  const hasQuizAccess = accessLevels.isSubscribed||accessLevels.isAuthenticated || accessLevels.isPublic
  const { toast } = useToast()
  const { data: session } = useSession()
  const isUserAuthenticated = accessLevels.isAuthenticated || !!session
  const effectiveChapterId = chapterId || chapter?.id?.toString()

  const [quizState, dispatch] = useReducer(quizReducer, {
    answers: {},
    currentQuestionIndex: 0,
    quizCompleted: false,
    score: 0,
    showResults: false,
    quizStarted: false,
    quizProgress: {},
  })

  const demoQuestions = useMemo(() => [
    {
      id: "obs-1",
      question: "How would you best describe an Observable in reactive programming?",
      options: [
        "stream of Click events",
        "object function",
        "data storage detail",
        "sequence of Click events",
      ],
      answer: "stream of Click events",
    },
  ], [])

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

  const saveProgress = useCallback((data: Record<string, any>) => {
    if (!effectiveChapterId) return
    try {
      localStorage.setItem(
        `quiz-progress-${effectiveChapterId}`,
        JSON.stringify({ ...quizState.quizProgress, ...data, lastUpdated: new Date().toISOString() }),
      )
    } catch (e) {
      console.error("Failed to save quiz progress", e)
    }
  }, [quizState.quizProgress, effectiveChapterId])

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
            ? (() => { try { return JSON.parse(q.options) } catch { return [] } })()
            : q.options ? [q.options] : [],
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="text-center py-12">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ready to test your knowledge?</h2>
        <Button onClick={startQuiz} size="lg">Start Quiz</Button>
      </CardContent>
    </Card>
  )

  const activeQuizContent = currentQuestion && (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{currentQuestion.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={quizState.answers[currentQuestion.id] || ""}
          onValueChange={handleAnswer}
        >
          {currentQuestion.options.map((opt: string, idx: number) => (
            <div
              key={idx}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition"
            >
              <RadioGroupItem value={opt} id={`option-${idx}`} />
              <Label htmlFor={`option-${idx}`} className="cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button onClick={submitAnswer}>Submit & Continue</Button>
      </CardContent>
    </Card>
  )

  const resultsContent = (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🎉 Quiz Completed</CardTitle>
        <p className="text-muted-foreground mt-1">
          You scored <span className="font-bold">{quizState.score}</span> out of{" "}
          {effectiveQuestions.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {effectiveQuestions.map((q, index) => {
          const userAnswer = quizState.answers[q.id]
          const isCorrect = userAnswer?.trim() === q.answer?.trim()
          return (
            <div
              key={q.id}
              className={cn(
                "p-4 rounded-md border",
                isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-red-500 bg-red-50 dark:bg-red-900/10"
              )}
            >
              <h4 className="font-medium">{index + 1}. {q.question}</h4>
              <p className="mt-2">
                <span className="font-semibold">Your answer: </span>
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>{userAnswer || "No answer"}</span>
              </p>
              {!isCorrect && (
                <p>
                  <span className="font-semibold">Correct answer: </span>
                  <span className="text-green-700">{q.answer}</span>
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
      <CardContent className="text-center">
        <Button onClick={retakeQuiz}>Retake Quiz</Button>
      </CardContent>
    </Card>
  )

  const errorContent = (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="text-red-500 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <p>Error loading quiz: {(error as Error)?.message}</p>
      </CardContent>
    </Card>
  )

  const content = isError
    ? errorContent
    : isLoading
      ? <QuizSkeleton />
      : !quizState.quizStarted
        ? startContent
        : quizState.quizCompleted
          ? resultsContent
          : activeQuizContent

  return (
    <AccessControl
      hasAccess={hasQuizAccess}
      featureTitle="Premium Quiz Feature"
      showPreview={isPublicCourse}
    >
      {content}
    </AccessControl>
  )
}
