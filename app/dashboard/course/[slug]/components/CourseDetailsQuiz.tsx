"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ChevronRight, AlertCircle, ChevronLeft, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
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

// Improve the quiz experience for unauthenticated users
export default function CourseDetailsQuiz({ chapter, course, isPremium, isPublicCourse, chapterId }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizProgress, setQuizProgress] = useState<Record<string, any>>({})
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAuthenticated = !!session

  // Use the provided chapterId or fall back to chapter.id
  const effectiveChapterId = chapterId || chapter?.id?.toString()

  // Load saved quiz progress from localStorage
  useEffect(() => {
    if (effectiveChapterId) {
      const savedProgress = localStorage.getItem(`quiz-progress-${effectiveChapterId}`)
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress)
          setQuizProgress(progress)

          // If quiz was completed, show results
          if (progress.completed) {
            setQuizCompleted(true)
            setScore(progress.score || 0)
            setAnswers(progress.answers || {})
          } else if (progress.currentIndex !== undefined) {
            setCurrentQuestionIndex(progress.currentIndex)
            setAnswers(progress.answers || {})
            setQuizStarted(true)
          }
        } catch (e) {
          console.error("Error parsing saved quiz progress:", e)
        }
      }
    }
  }, [effectiveChapterId])

  // Save quiz progress to localStorage
  const saveProgress = useCallback(
    (data: Record<string, any>) => {
      if (effectiveChapterId) {
        localStorage.setItem(
          `quiz-progress-${effectiveChapterId}`,
          JSON.stringify({
            ...quizProgress,
            ...data,
            lastUpdated: new Date().toISOString(),
          }),
        )
      }
    },
    [effectiveChapterId, quizProgress],
  )

  // Create a set of demo questions for unauthenticated users
  const demoQuestions = useMemo(() => {
    return [
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
    ]
  }, [])

  // Modify the query function to better work with your existing API routes
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

      console.log("Fetching quiz data for:", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      // Use the existing coursequiz API route
      const response = await axios.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: Number(effectiveChapterId),
        chapterName: chapter.title || chapter.name,
      })

      // Log the response for debugging
      console.log("Quiz API response:", response.data)

      // If the response is empty or not an array, return an empty array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn("Invalid response format from quiz API:", response.data)
        return []
      }

      // Process the response data based on your API's actual response format
      return response.data.map((question: any) => ({
        ...question,
        id: question.id || `question-${Math.random().toString(36).substr(2, 9)}`,
        options: Array.isArray(question.options)
          ? question.options
          : typeof question.options === "string"
            ? JSON.parse(question.options)
            : question.options
              ? [question.options]
              : [],
      }))
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
    enabled: isPremium && quizStarted && isAuthenticated,
    onError: (err) => {
      console.error("Quiz data fetch error:", err)
    },
  })

  // Use demo questions for unauthenticated users
  const effectiveQuestions = useMemo(() => {
    if (!isPremium || !isAuthenticated) {
      return demoQuestions
    }

    // If we have questions from the API, use them
    if (questions && questions.length > 0) {
      return questions
    }

    // If we're not loading and there are no questions, use demo questions as fallback
    if (!isQuizLoading && (!questions || questions.length === 0)) {
      console.log("No quiz questions found, using demo questions as fallback")
      return demoQuestions
    }

    return []
  }, [isPremium, isAuthenticated, questions, demoQuestions, isQuizLoading])

  const currentQuestion = useMemo(
    () => (effectiveQuestions && effectiveQuestions.length > 0 ? effectiveQuestions[currentQuestionIndex] : null),
    [effectiveQuestions, currentQuestionIndex],
  )

  const handleAnswer = useCallback(
    (value: string) => {
      if (currentQuestion) {
        const newAnswers = { ...answers, [currentQuestion.id]: value }
        setAnswers(newAnswers)
        saveProgress({ answers: newAnswers, currentIndex: currentQuestionIndex })
      }
    },
    [currentQuestion, answers, currentQuestionIndex, saveProgress],
  )

  const checkAnswer = useCallback(() => {
    if (currentQuestion) {
      const userAnswer = answers[currentQuestion.id]
      const isCorrect = userAnswer?.trim() === currentQuestion.answer?.trim()

      if (isCorrect) {
        setScore((prev) => prev + 1)
      }

      if (currentQuestionIndex < (effectiveQuestions?.length ?? 0) - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        saveProgress({ currentIndex: nextIndex })
      } else {
        const finalScore = score + (isCorrect ? 1 : 0)
        setQuizCompleted(true)
        saveProgress({
          completed: true,
          score: finalScore,
          completedAt: new Date().toISOString(),
        })

        toast({
          title: "Quiz Completed!",
          description: `You scored ${finalScore} out of ${effectiveQuestions?.length}`,
        })
      }
    }
  }, [currentQuestion, answers, currentQuestionIndex, effectiveQuestions?.length, score, saveProgress, toast])

  const retakeQuiz = useCallback(() => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setScore(0)
    setShowResults(false)
    saveProgress({
      completed: false,
      currentIndex: 0,
      answers: {},
      score: 0,
    })
  }, [saveProgress])

  const handleShowResults = useCallback(() => {
    setShowResults(true)
  }, [])

  const startQuiz = useCallback(() => {
    setQuizStarted(true)
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
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center space-x-2 mb-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
          <div className="flex justify-between mt-8">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    )
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

  if (isPremium && isAuthenticated && !quizStarted) {
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
          {!quizCompleted && currentQuestion ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Progress value={((currentQuestionIndex + 1) / effectiveQuestions.length) * 100} className="mb-6 h-2" />
              <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
              <RadioGroup onValueChange={handleAnswer} value={answers[currentQuestion.id]} className="space-y-2">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={`${option}-${index}`}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                      answers[currentQuestion.id] === option
                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                        : "hover:bg-accent/50 dark:hover:bg-accent/20",
                    )}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" />
                    <Label htmlFor={`option-${index}`} className="text-base flex-grow cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </motion.div>
          ) : quizCompleted ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <h2 className="text-4xl font-bold mb-8">Quiz Completed!</h2>
              <p className="text-2xl mb-8">
                Your score:{" "}
                <span className="text-primary font-bold">
                  {score} / {effectiveQuestions.length}
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
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
            {effectiveQuestions.map((question, index) => (
              <div
                key={`${question.id}-${index}`}
                className={cn(
                  "mb-6 p-4 rounded-lg",
                  answers[question.id] === question.answer
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
                    answers[question.id] === question.answer
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400",
                  )}
                >
                  Your answer: {answers[question.id] || "Not answered"}
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
      {!quizCompleted && currentQuestion && (
        <CardFooter className="flex justify-between p-8 bg-muted/50 border-t border-border relative z-10">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            size="lg"
            className="text-lg px-6 py-3"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            Previous
          </Button>
          <Button
            onClick={checkAnswer}
            disabled={!answers[currentQuestion.id]}
            className={cn("text-lg px-6 py-3", {
              "opacity-50 cursor-not-allowed": !answers[currentQuestion.id],
            })}
            size="lg"
          >
            {currentQuestionIndex === effectiveQuestions.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
