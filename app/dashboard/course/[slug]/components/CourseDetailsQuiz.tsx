"use client"

import { useCallback, useMemo, useEffect, useReducer } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ChevronRight, AlertCircle, ChevronLeft, Lock } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

import QuizBackground from "./QuizBackground"

import type { CourseQuestion, FullChapterType, FullCourseType } from "@/app/types/types"

type Props = {
  isPremium: boolean
  isPublicCourse: boolean
  chapter: FullChapterType
  course: FullCourseType
  chapterId?: string
}

// Quiz state reducer for better state management
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
      return {
        ...state,
        showResults: true,
      }
    case "START_QUIZ":
      return {
        ...state,
        quizStarted: true,
      }
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

// Memoized skeleton component
const QuizSkeleton = () => (
  <Card className="w-full max-w-4xl mx-auto">
    <CardContent className="p-8">
      <div className="flex items-center space-x-2 mb-4">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-4 w-full mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
      <div className="flex justify-between mt-8">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </CardContent>
  </Card>
)

// Memoized option component
const QuizOption = ({
  option,
  index,
  questionId,
  selectedAnswer,
  onAnswerChange,
}: {
  option: string
  index: number
  questionId: string
  selectedAnswer: string
  onAnswerChange: (value: string) => void
}) => (
  <div
    className={cn(
      "flex items-center space-x-3 p-3 rounded-lg transition-colors",
      selectedAnswer === option
        ? "bg-primary/10 text-primary dark:bg-primary/20"
        : "hover:bg-accent/50 dark:hover:bg-accent/20",
    )}
  >
    <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" />
    <Label htmlFor={`option-${index}`} className="text-base flex-grow cursor-pointer">
      {option}
    </Label>
  </div>
)

export default function CourseDetailsQuiz({ chapter, course, isPremium, isPublicCourse, chapterId }: Props) {
  const [quizState, dispatch] = useReducer(quizReducer, {
    answers: {},
    currentQuestionIndex: 0,
    quizCompleted: false,
    score: 0,
    showResults: false,
    quizStarted: false,
    quizProgress: {},
  })

  const { toast } = useToast()
  const { data: session } = useSession()
  const isAuthenticated = !!session

  // Use the provided chapterId or fall back to chapter.id
  const effectiveChapterId = chapterId || chapter?.id?.toString()

  // Create a set of demo questions for unauthenticated users
  const demoQuestions = useMemo(
    () => [
      {
        id: "demo1",
        question: "What is the primary purpose of this course?",
        options: [
          "To teach programming fundamentals",
          "To explore advanced concepts",
          "To provide practical examples",
          "All of the above",
        ],
        answer: "All of the above",
      },
      {
        id: "demo2",
        question: "Which of the following is a key benefit of taking this course?",
        options: [
          "Hands-on coding exercises",
          "Theoretical knowledge only",
          "No practical applications",
          "Limited examples",
        ],
        answer: "Hands-on coding exercises",
      },
      {
        id: "demo3",
        question: "What would you need to access the full quiz content?",
        options: ["A premium subscription", "Nothing, it's all free", "A different browser", "Special software"],
        answer: "A premium subscription",
      },
    ],
    [],
  )

  // Load saved quiz progress from localStorage with error handling
  useEffect(() => {
    if (effectiveChapterId) {
      try {
        const savedProgress = localStorage.getItem(`quiz-progress-${effectiveChapterId}`)
        if (savedProgress) {
          const progress = JSON.parse(savedProgress)
          dispatch({ type: "LOAD_PROGRESS", progress })
        }
      } catch (e) {
        console.error("Error parsing saved quiz progress:", e)
      }
    }
  }, [effectiveChapterId])

  // Save quiz progress to localStorage with error handling
  const saveProgress = useCallback(
    (data: Record<string, any>) => {
      if (effectiveChapterId) {
        try {
          localStorage.setItem(
            `quiz-progress-${effectiveChapterId}`,
            JSON.stringify({
              ...quizState.quizProgress,
              ...data,
              lastUpdated: new Date().toISOString(),
            }),
          )
        } catch (e) {
          console.error("Error saving quiz progress:", e)
        }
      }
    },
    [effectiveChapterId, quizState.quizProgress],
  )

  // Optimized query with better error handling and retry logic
  const {
    data: questions,
    isError,
    error,
    isLoading: isQuizLoading,
  } = useQuery<CourseQuestion[]>({
    queryKey: ["transcript", effectiveChapterId],
    queryFn: async () => {
      if (!chapter?.videoId || !effectiveChapterId) {
        throw new Error("Required chapter data is missing.")
      }

      // If chapter.questions is present and non-empty, use it directly
      if (Array.isArray(chapter.questions) && chapter.questions.length > 0) {
        return chapter.questions.map((q: any) => ({
          ...q,
          id: q.id || `question-${Math.random().toString(36).substr(2, 9)}`,
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
      }

      const response = await axios.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      if (!response.data || !Array.isArray(response.data)) {
        return []
      }

      return response.data.map((question: any) => ({
        ...question,
        id: question.id || `question-${Math.random().toString(36).substr(2, 9)}`,
        options: Array.isArray(question.options)
          ? question.options
          : typeof question.options === "string"
            ? (() => {
                try {
                  return JSON.parse(question.options)
                } catch {
                  return []
                }
              })()
            : question.options
              ? [question.options]
              : [],
      }))
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    enabled: isPremium && quizState.quizStarted && isAuthenticated,
    onError: (err) => {
      console.error("[CourseDetailsQuiz] Quiz data fetch error:", err)
      toast({
        title: "Error loading quiz",
        description: "We'll try again shortly. You can also manually retry.",
        variant: "destructive",
      })
    },
  })

  // Use demo questions for unauthenticated users
  const effectiveQuestions = useMemo(() => {
    if (!isPremium || !isAuthenticated) {
      return demoQuestions
    }

    if (questions && questions.length > 0) {
      return questions
    }

    if (!isQuizLoading && (!questions || questions.length === 0)) {
      return demoQuestions
    }

    return []
  }, [isPremium, isAuthenticated, questions, demoQuestions, isQuizLoading])

  const currentQuestion = useMemo(
    () =>
      effectiveQuestions && effectiveQuestions.length > 0 ? effectiveQuestions[quizState.currentQuestionIndex] : null,
    [effectiveQuestions, quizState.currentQuestionIndex],
  )

  const handleAnswer = useCallback(
    (value: string) => {
      if (currentQuestion) {
        dispatch({ type: "SET_ANSWER", questionId: currentQuestion.id, answer: value })
        saveProgress({
          answers: { ...quizState.answers, [currentQuestion.id]: value },
          currentIndex: quizState.currentQuestionIndex,
        })
      }
    },
    [currentQuestion, quizState.answers, quizState.currentQuestionIndex, saveProgress],
  )

  const checkAnswer = useCallback(() => {
    if (currentQuestion) {
      const userAnswer = quizState.answers[currentQuestion.id]
      const isCorrect = userAnswer?.trim() === currentQuestion.answer?.trim()

      let newScore = quizState.score
      if (isCorrect) {
        newScore += 1
      }

      if (quizState.currentQuestionIndex < (effectiveQuestions?.length ?? 0) - 1) {
        dispatch({ type: "NEXT_QUESTION" })
        saveProgress({ currentIndex: quizState.currentQuestionIndex + 1 })
      } else {
        dispatch({ type: "COMPLETE_QUIZ", score: newScore })
        saveProgress({
          completed: true,
          score: newScore,
          completedAt: new Date().toISOString(),
        })

        toast({
          title: "Quiz Completed!",
          description: `You scored ${newScore} out of ${effectiveQuestions?.length}`,
        })
      }
    }
  }, [
    currentQuestion,
    quizState.answers,
    quizState.currentQuestionIndex,
    quizState.score,
    effectiveQuestions?.length,
    saveProgress,
    toast,
  ])

  const retakeQuiz = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" })
    saveProgress({
      completed: false,
      currentIndex: 0,
      answers: {},
      score: 0,
    })
  }, [saveProgress])

  const handleShowResults = useCallback(() => {
    dispatch({ type: "SHOW_RESULTS" })
  }, [])

  const startQuiz = useCallback(() => {
    dispatch({ type: "START_QUIZ" })
    saveProgress({ started: true, startedAt: new Date().toISOString() })
  }, [saveProgress])

  // If not premium but public course, show demo quiz with a premium upgrade prompt
  if (!isPremium && isPublicCourse) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-card">
        <CardHeader className="relative z-10 text-center">
          <CardTitle className="text-2xl">Chapter Quiz Preview</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-6">
          <div className="bg-background/50 rounded-lg p-6 border border-border mb-6">
            <h3 className="text-lg font-semibold mb-2">Sample Question</h3>
            <p className="mb-4">What is the primary purpose of this course?</p>
            <div className="space-y-2">
              {[
                "To teach programming fundamentals",
                "To explore advanced concepts",
                "To provide practical examples",
                "All of the above",
              ].map((option, i) => (
                <div key={i} className="p-3 border rounded-md bg-card/50">
                  {option}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" disabled>
                Previous
              </Button>
              <Button disabled>Next</Button>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">
              Upgrade to Premium to access interactive quizzes for all chapters.
            </p>
            <Button onClick={() => (window.location.href = "/dashboard/subscription")}>Upgrade to Premium</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isPremium) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center h-40 text-center">
          <Lock className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground mb-4">Upgrade to Premium to access quizzes.</p>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-40">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-6 h-6" />
            <p className="text-lg">Error loading quiz: {(error as Error).message || "Please try again later."}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isQuizLoading) {
    return <QuizSkeleton />
  }

  if (!effectiveQuestions || effectiveQuestions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-lg">No quiz available for this chapter.</p>
        </CardContent>
      </Card>
    )
  }

  if (isPremium && isAuthenticated && !quizState.quizStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Chapter Quiz Available</h3>
          <p className="text-muted-foreground mb-6">Test your knowledge of this chapter with our interactive quiz.</p>
          <Button onClick={startQuiz} size="lg">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto relative overflow-hidden bg-card">
      <QuizBackground />
      <CardHeader className="p-8 bg-background/50 relative z-10 border-b">
        <CardTitle className="text-3xl flex items-center space-x-4">
          <CheckCircle className="w-8 h-8 text-primary" />
          <span>Concept Check</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 relative z-10">
        <AnimatePresence mode="wait">
          {!quizState.quizCompleted && currentQuestion ? (
            <motion.div
              key={quizState.currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Progress
                value={((quizState.currentQuestionIndex + 1) / effectiveQuestions.length) * 100}
                className="mb-6 h-2"
              />
              <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
              <RadioGroup
                onValueChange={handleAnswer}
                value={quizState.answers[currentQuestion.id]}
                className="space-y-2"
                aria-label="Quiz options"
              >
                {currentQuestion.options.map((option: string, index: number) => (
                  <QuizOption
                    key={`${option}-${index}`}
                    option={option}
                    index={index}
                    questionId={currentQuestion.id}
                    selectedAnswer={quizState.answers[currentQuestion.id]}
                    onAnswerChange={handleAnswer}
                  />
                ))}
              </RadioGroup>
            </motion.div>
          ) : quizState.quizCompleted ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <h2 className="text-4xl font-bold mb-8">Quiz Completed!</h2>
              <p className="text-2xl mb-8">
                Your score:{" "}
                <span className="text-primary font-bold">
                  {quizState.score} / {effectiveQuestions.length}
                </span>
              </p>
              <div className="space-x-4">
                <Button onClick={handleShowResults} size="lg" className="text-xl px-10 py-6" variant="outline">
                  Show Results
                </Button>
                <Button onClick={retakeQuiz} size="lg" className="text-xl px-10 py-6">
                  Retake Quiz
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {quizState.showResults && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
            {effectiveQuestions.map((question, index) => (
              <div
                key={`${question.id}-${index}`}
                className={cn(
                  "mb-6 p-4 rounded-lg",
                  quizState.answers[question.id] === question.answer
                    ? "bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                )}
              >
                <p className="font-semibold mb-2">
                  {index + 1}. {question.question}
                </p>
                <p
                  className={cn(
                    "text-sm mb-1",
                    quizState.answers[question.id] === question.answer
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400",
                  )}
                >
                  Your answer: {quizState.answers[question.id] || "Not answered"}
                </p>
                <p className="text-sm text-primary font-medium">Correct answer: {question.answer}</p>
              </div>
            ))}
            <div className="mt-6 text-center">
              <Button onClick={retakeQuiz} size="lg">
                Retake Quiz
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
      {!quizState.quizCompleted && currentQuestion && (
        <CardFooter className="flex justify-between p-8 bg-muted/50 border-t border-border relative z-10">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "NEXT_QUESTION" })}
            disabled={quizState.currentQuestionIndex === 0}
            size="lg"
            className="text-lg px-6 py-3"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            Previous
          </Button>
          <Button
            onClick={checkAnswer}
            disabled={!quizState.answers[currentQuestion.id]}
            className={cn("text-lg px-6 py-3", {
              "opacity-50 cursor-not-allowed": !quizState.answers[currentQuestion.id],
            })}
            size="lg"
            aria-label={
              quizState.currentQuestionIndex === effectiveQuestions.length - 1 ? "Finish quiz" : "Next question"
            }
          >
            {quizState.currentQuestionIndex === effectiveQuestions.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
