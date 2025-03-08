"use client"

import { useState, useCallback, useMemo } from "react"
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

import QuizBackground from "./QuizBackground"

import type { CourseQuestion, FullChapterType, FullCourseType } from "@/app/types/types"
import type { CourseQuiz } from "@prisma/client"
import PageLoader from "@/components/ui/loader"

type Props = {
  course: FullCourseType
  chapter: FullChapterType & {
    questions: CourseQuestion[]
  }
  isPremium: boolean
  isPublicCourse: boolean
}

export default function CourseDetailsQuiz({ chapter, course, isPremium, isPublicCourse }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const {
    data: questions,
    isError,
    error,
    isLoading: isQuizLoading,
  } = useQuery<CourseQuestion[]>({
    queryKey: ["transcript", chapter?.id],
    queryFn: async () => {
      if (!chapter?.videoId || !chapter?.id) {
        throw new Error("Required chapter data is missing.")
      }
      const response = await axios.post("/api/coursequiz", {
        videoId: chapter.videoId,
        chapterId: chapter.id,
        chapterName: chapter.title,
      })
      if (response.data.error) {
        throw new Error(response.data.error)
      }
      return response.data.map((question: CourseQuiz) => ({
        ...question,
        options: Array.isArray(question.options) ? question.options : JSON.parse(question.options),
      }))
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
    enabled: isPremium, // Only fetch if user is premium
  })

  const currentQuestion = useMemo(
    () => (questions && questions.length > 0 ? questions[currentQuestionIndex] : null),
    [questions, currentQuestionIndex],
  )

  const handleAnswer = useCallback(
    (value: string) => {
      if (currentQuestion) {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
      }
    },
    [currentQuestion],
  )

  const checkAnswer = useCallback(() => {
    if (currentQuestion) {
      const userAnswer = answers[currentQuestion.id]
      const isCorrect = userAnswer?.trim() === currentQuestion.answer?.trim()

      if (isCorrect) {
        setScore((prev) => prev + 1)
      }

      if (currentQuestionIndex < (questions?.length ?? 0) - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else {
        setQuizCompleted(true)
      }
    }
  }, [currentQuestion, answers, currentQuestionIndex, questions])

  const retakeQuiz = useCallback(() => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setScore(0)
    setShowResults(false)
  }, [])

  const handleShowResults = useCallback(() => {
    setShowResults(true)
  }, [])

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
    return <PageLoader />
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-lg">No quiz available for this chapter.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto relative overflow-hidden bg-card">
      <QuizBackground />
      <CardHeader className="p-8 bg-muted/50 relative z-10 border-b border-border">
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
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-6 h-2" />
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
                  {score} / {questions.length}
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
            {questions.map((question, index) => (
              <div key={`${question.id}-${index}`} className="mb-6 p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">
                  {index + 1}. {question.question}
                </p>
                <p className="text-sm mb-1">Your answer: {answers[question.id]}</p>
                <p className="text-sm text-primary">Correct answer: {question.answer}</p>
              </div>
            ))}
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
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

