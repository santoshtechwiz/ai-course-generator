"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Trophy, HelpCircle, ArrowRight, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"

import { useQuizResult } from "@/hooks/use-quiz-result"
import { QuizSubmissionFeedback } from "@/components/QuizSubmissionFeedback"
import { formatQuizTime } from "@/lib/quiz-result-service"
import { useAnimation } from "@/providers/animation-provider"
import { MotionTransition, MotionWrapper } from "@/components/ui/animations/motion-wrapper"
import { QuizBase } from "@/components/features/quiz-results/QuizBase"
import { QuizResultDisplay } from "@/components/features/quiz-results/QuizResultDisplay"


const formatQuizTimeLocal = (seconds: number): string => {
  if (typeof formatQuizTime === "function") {
    return formatQuizTime(seconds)
  }

  // Fallback implementation
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

type Question = {
  id: number
  question: string
  answer: string
  option1: string
  option2: string
  option3: string
}

interface McqQuizProps {
  questions: Question[]
  quizId: number | string
  slug: string
  title: string
  onComplete?: () => void
  onSubmitAnswer?: (questionId: number, answer: string, isCorrect: boolean) => void
}

export default function McqQuiz({ questions, quizId, slug, title, onComplete }: McqQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(new Array(questions.length).fill(null))
  const [startTimes, setStartTimes] = useState<number[]>(new Array(questions.length).fill(Date.now()))
  const [timeSpent, setTimeSpent] = useState<number[]>(new Array(questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [uniqueOptions, setUniqueOptions] = useState<string[]>([])
  const [hasError, setHasError] = useState(false)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const userId = session?.user?.id || "guest"

  const { submitQuizResult, isSubmitting, isSuccess, isError, errorMessage, resetSubmissionState, result } =
    useQuizResult()

  const currentQuestion = useMemo(() => {
    return (
      questions[currentQuestionIndex] || {
        id: 0,
        question: "",
        answer: "",
        option1: "",
        option2: "",
        option3: "",
      }
    )
  }, [currentQuestionIndex, questions])

  useEffect(() => {
    setStartTimes((prev) => {
      const newStartTimes = [...prev]
      newStartTimes[currentQuestionIndex] = Date.now()
      return newStartTimes
    })

    const savedResults = localStorage.getItem(`quizResults-${userId}-${quizId}`)
    if (savedResults) {
      try {
        setQuizResults(JSON.parse(savedResults))
        setQuizCompleted(true)
      } catch (error) {
        console.error("Error parsing saved quiz results:", error)
      }
    }
  }, [userId, quizId, currentQuestionIndex])

  useEffect(() => {
    if (currentQuestion) {
      const allOptions = [
        currentQuestion.answer,
        currentQuestion.option1,
        currentQuestion.option2,
        currentQuestion.option3,
      ].filter(Boolean)

      const uniqueOptionsSet = new Set(allOptions)

      if (uniqueOptionsSet.size < 2) {
        setHasError(true)
        return
      }

      if (uniqueOptionsSet.size < 4) {
        const fallbackOptions = [
          "None of the above",
          "All of the above",
          "Not enough information",
          "Cannot be determined",
        ]

        let i = 0
        while (uniqueOptionsSet.size < 4 && i < fallbackOptions.length) {
          uniqueOptionsSet.add(fallbackOptions[i])
          i++
        }
      }

      const shuffledOptions = [...uniqueOptionsSet].sort(() => Math.random() - 0.5)
      setUniqueOptions(shuffledOptions)
      setHasError(false)
    }
  }, [currentQuestion])

  const handleSelectOption = (option: string) => {
    setSelectedOptions((prev) => {
      const newSelectedOptions = [...prev]
      newSelectedOptions[currentQuestionIndex] = option
      return newSelectedOptions
    })
  }

  const calculateScore = useCallback(() => {
    return selectedOptions.reduce((score, selected, index) => {
      const correctAnswer = questions[index]?.answer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [selectedOptions, questions])

  const handleNextQuestion = useCallback(async () => {
    const currentTime = Date.now()
    const timeSpentOnQuestion = Math.round((currentTime - startTimes[currentQuestionIndex]) / 1000)

    setTimeSpent((prev) => {
      const newTimeSpent = [...prev]
      newTimeSpent[currentQuestionIndex] = timeSpentOnQuestion
      return newTimeSpent
    })

    const answerData = {
      answer: selectedOptions[currentQuestionIndex] || "",
      isCorrect: selectedOptions[currentQuestionIndex] === currentQuestion.answer,
      timeSpent: timeSpentOnQuestion,
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
      setStartTimes((prev) => {
        const newStartTimes = [...prev]
        newStartTimes[currentQuestionIndex + 1] = Date.now()
        return newStartTimes
      })
    } else {
      try {
        const correctCount = calculateScore()
        const score = (correctCount / questions.length) * 100
        const totalTimeSpent =
          timeSpent.reduce((sum, time) => sum + time, 0) + (Date.now() - startTimes[currentQuestionIndex]) / 1000

        const answers = selectedOptions.map((answer, index) => ({
          questionId: questions[index]?.id,
          userAnswer: answer || "",
          isCorrect: answer === questions[index]?.answer,
          timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
          hintsUsed: false,
        }))

        if (isAuthenticated) {
          setShowFeedbackModal(true)
          await submitQuizResult(quizId.toString(), answers, Math.round(totalTimeSpent), correctCount, "mcq")

          setQuizResults({
            slug,
            quizId,
            answers,
            elapsedTime: Math.round(totalTimeSpent),
            score,
            type: "mcq",
          })
        } else {
          const results = {
            slug,
            quizId,
            answers: selectedOptions.map((answer, index) => ({
              questionId: questions[index]?.id,
              userAnswer: answer || "",
              isCorrect: answer === questions[index]?.answer,
              timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
              hintsUsed: false,
            })),
            elapsedTime: Math.round(totalTimeSpent),
            score,
            type: "mcq",
          }
          localStorage.setItem(`quizResults-${userId}-${quizId}`, JSON.stringify(results))
          setQuizResults(results)
          setQuizCompleted(true)
          if (onComplete) onComplete()
        }
      } catch (error) {
        console.error("Error submitting quiz data:", error)
      }
    }
  }, [
    currentQuestionIndex,
    questions,
    quizId,
    selectedOptions,
    calculateScore,
    startTimes,
    timeSpent,
    slug,
    isAuthenticated,
    submitQuizResult,
    currentQuestion.answer,
    onComplete,
    userId,
  ])

  const handleFeedbackContinue = useCallback(
    (proceed: boolean): boolean => {
      setShowFeedbackModal(false)
      setQuizCompleted(true)
      if (onComplete) onComplete?.()
      resetSubmissionState?.()
      return proceed
    },
    [onComplete, resetSubmissionState],
  )

  const restartQuiz = useCallback(() => {
    localStorage.removeItem(`quizResults-${userId}-${quizId}`)
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Array(questions.length).fill(null))
    setStartTimes(new Array(questions.length).fill(Date.now()))
    setTimeSpent(new Array(questions.length).fill(0))
    setQuizCompleted(false)
    setQuizResults(null)
    resetSubmissionState()
  }, [questions.length, userId, quizId, resetSubmissionState])

  const renderQuizContent = () => {
    const { animationsEnabled:anim } = useAnimation()

    if (hasError) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">This question needs review due to insufficient options.</p>
            <Button onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>Skip to Next Question</Button>
          </CardContent>
        </Card>
      )
    }

    if (quizCompleted) {
      const correctCount = calculateScore()
      const totalQuestions = questions.length
      const percentage = (correctCount / totalQuestions) * 100
      const totalTime = quizResults?.elapsedTime ?? timeSpent.reduce((sum, time) => sum + time, 0)

      if (isAuthenticated) {
        return (
          <MotionWrapper animate={anim} variant="fade" duration={0.6}>
            <QuizResultDisplay
              quizId={quizId.toString()}
              title={title}
              score={percentage}
              totalQuestions={totalQuestions}
              totalTime={totalTime}
              correctAnswers={correctCount}
              type="mcq"
              slug={slug}
            />
          </MotionWrapper>
        )
      }
      return (
        <MotionWrapper animate={animationsEnabled} variant="fade" duration={0.6}>
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center space-y-6">
              <Trophy className="w-16 h-16 text-primary" />

              {!session ? (
                <>
                  <SignInPrompt callbackUrl={`/dashboard/mcq/${slug}`} />
                </>
              ) : null}
            </CardContent>
          </Card>
        </MotionWrapper>
      )
    }

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100
    const animationsEnabled = useAnimation().animationsEnabled

    return (
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <MotionWrapper animate={animationsEnabled} variant="slide" direction="down" duration={0.4}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary font-medium px-3 py-1">
                  Quiz
                </Badge>
                <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help">
                      <Timer className="w-4 h-4" />
                      {formatQuizTimeLocal(timeSpent.reduce((a, b) => a + b, 0))}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total time spent on the quiz</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </MotionWrapper>
          <MotionWrapper animate={animationsEnabled} variant="slide" direction="up" duration={0.4} delay={0.1}>
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress: {Math.round(progress)}%</span>
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
            </div>
          </MotionWrapper>
        </CardHeader>
        <CardContent>
          <MotionTransition key={currentQuestionIndex}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold">{currentQuestion.question}</h2>
                </div>
                <RadioGroup
                  value={selectedOptions[currentQuestionIndex] || ""}
                  onValueChange={handleSelectOption}
                  className="space-y-3 w-full mt-4"
                >
                  {uniqueOptions.map((option, index) => (
                    <motion.div
                      key={`${index}-${option}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                          "border-2",
                          selectedOptions[currentQuestionIndex] === option
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted",
                        )}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-grow cursor-pointer font-medium text-sm sm:text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </MotionTransition>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
          <p className="text-sm text-muted-foreground">
            Question time: {formatQuizTimeLocal(timeSpent[currentQuestionIndex] || 0)}
          </p>
          <Button
            onClick={handleNextQuestion}
            disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : currentQuestionIndex === questions.length - 1 ? (
              "Finish Quiz"
            ) : (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <QuizBase quizId={quizId.toString()} slug={slug} title={title} type="mcq" totalQuestions={questions.length}>
      {renderQuizContent()}

      {showFeedbackModal && (
        <QuizSubmissionFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={isError}
          score={calculateScore()}
          totalQuestions={questions.length}
          onContinue={(proceed) => handleFeedbackContinue(proceed)}
          errorMessage={errorMessage}
          quizType="mcq"
        />
      )}
    </QuizBase>
  )
}
