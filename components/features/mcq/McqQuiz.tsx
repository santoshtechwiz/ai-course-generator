"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Timer, HelpCircle, RefreshCcw, Trophy, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageLoader from "@/components/ui/loader"
import { SignInPrompt } from "@/components/SignInPrompt"
import { saveQuizResult } from "@/lib/quiz-result-service"

// Ensure that `useSubmitQuiz` is correctly implemented in `useQuizData` and returns an object with `mutateAsync`.

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
  quizId: number
  slug: string
  title: string
}

export default function McqQuiz({ questions, quizId, slug, title }: McqQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [uniqueOptions, setUniqueOptions] = useState<string[]>([])
  const [hasError, setHasError] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [questionTimes, setQuestionTimes] = useState<number[]>([])
  const [startTime] = useState<number>(Date.now())
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const [loading, setLoading] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [showMotivationalQuote, setShowMotivationalQuote] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<any>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const motivationalQuotes = [
    { text: "Every mistake is a step toward success.", emoji: "✨" },
    { text: "The only true failure is giving up.", emoji: "🚀" },
    { text: "Your persistence is your measure of faith in yourself.", emoji: "💪" },
    { text: "Success is stumbling from failure to failure with no loss of enthusiasm.", emoji: "🌟" },
    { text: "The expert in anything was once a beginner.", emoji: "🌱" },
    { text: "Progress, not perfection.", emoji: "🏆" },
    { text: "Challenges are what make life interesting.", emoji: "🧠" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", emoji: "⚡" },
    { text: "Don't watch the clock; do what it does. Keep going.", emoji: "⏱️" },
    { text: "Believe you can and you're halfway there.", emoji: "✅" },
    { text: "Your potential is endless. Keep going!", emoji: "🔥" },
    { text: "Every expert was once a beginner.", emoji: "🌈" },
    { text: "The difference between ordinary and extraordinary is practice.", emoji: "💡" },
    { text: "Skill comes from consistent effort and learning.", emoji: "🛠️" },
    { text: "Small progress is still progress.", emoji: "🌊" },
  ]

  const saveQuizResults = useCallback(
    async (quizData: any) => {
      try {
        setLoading(true)
        const { success, details, result } = await saveQuizResult({
          quizId,
          answers: quizData.answers,
          totalTime: quizData.totalTime,
          elapsedTime: quizData.totalTime,
          score: quizData.score,
          type: "mcq",
        })

        setLoading(false)
        toast({
          title: "Success",
          description: "Quiz score updated successfully!",
          variant: "default",
        })
        return true // Return success
      } catch (error) {
        console.error("Failed to update quiz score:", error)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to update quiz score. Please try again.",
          variant: "destructive",
        })
        return false // Return failure
      }
    },
    [quizId, toast],
  )

  const handleQuizCompletion = useCallback(async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000)

    const currentTime = timeSpent - (questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) : 0)
    const finalUserAnswers = [...userAnswers, selectedAnswer || ""]
    const finalQuestionTimes = [...questionTimes, currentTime]

    setQuizCompleted(true)

    const finalScore = finalUserAnswers.filter((answer, index) => answer === questions[index].answer).length
    setScore(finalScore)

    const quizData = {
      quizId,
      score: finalScore,
      totalTime: duration,
      answers: questions.map((q, index) => ({
        questionId: q.id,
        userAnswer: finalUserAnswers[index] || "",
        isCorrect: finalUserAnswers[index] === q.answer,
        timeSpent: finalQuestionTimes[index] || 0,
      })),
    }

    if (isAuthenticated) {
      await saveQuizResults(quizData) // Ensure this is awaited
    } else {
      localStorage.setItem(
        "quizResults",
        JSON.stringify({
          slug,
          quizData,
          score: finalScore,
          quizCompleted: true,
          timeSpent,
          userAnswers: finalUserAnswers,
          questionTimes: finalQuestionTimes,
        }),
      )
    }
  }, [
    isAuthenticated,
    questions,
    quizId,
    saveQuizResults,
    selectedAnswer,
    slug,
    startTime,
    timeSpent,
    userAnswers,
    questionTimes,
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!quizCompleted) {
        setTimeSpent((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [quizCompleted])

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

    setSelectedAnswer(null)
  }, [currentQuestion])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  const getRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
    return motivationalQuotes[randomIndex]
  }, [])

  const nextQuestion = useCallback(() => {
    setIsSubmitting(true)
    setTimeout(() => {
      const currentTime = timeSpent - (questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) : 0)
      setUserAnswers((prev) => [...prev, selectedAnswer || ""])
      setQuestionTimes((prev) => [...prev, currentTime])

      if (selectedAnswer === currentQuestion.answer) {
        setScore((prevScore) => prevScore + 1)
        setShowMotivationalQuote(false)
      } else {
        setIncorrectAnswers((prev) => {
          const newCount = prev + 1

          if (newCount === 3) {
            setCurrentQuote(getRandomQuote())
            setShowMotivationalQuote(true)
          } else if (newCount > 3) {
            if (Math.random() < 0.4) {
              setCurrentQuote(getRandomQuote())
              setShowMotivationalQuote(true)
            } else {
              setShowMotivationalQuote(false)
            }
          }

          return newCount
        })
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
        setSelectedAnswer(null)
      } else {
        handleQuizCompletion()
      }
      setIsSubmitting(false)
    }, 500)
  }, [
    currentQuestion.answer,
    currentQuestionIndex,
    handleQuizCompletion,
    questions.length,
    questionTimes,
    selectedAnswer,
    timeSpent,
    getRandomQuote,
  ])

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    if (isAuthenticated) {
      const savedResults = localStorage.getItem("quizResults")
      if (savedResults) {
        const {
          slug: savedSlug,
          quizData,
          score: savedScore,
          quizCompleted: savedQuizCompleted,
          timeSpent: savedTimeSpent,
          userAnswers: savedUserAnswers,
          questionTimes: savedQuestionTimes,
        } = JSON.parse(savedResults)

        if (savedSlug === slug) {
          setScore(savedScore)
          setQuizCompleted(savedQuizCompleted)
          setTimeSpent(savedTimeSpent)
          setUserAnswers(savedUserAnswers)
          setQuestionTimes(savedQuestionTimes)

          // Save the results to the server and then clear localStorage
          saveQuizResults(quizData).then(() => {
            // Remove from localStorage after successful submission
            localStorage.removeItem("quizResults")
          })
        }
      }
    }
  }, [isAuthenticated, slug, saveQuizResults])

  useEffect(() => {
    if (showMotivationalQuote) {
      const timer = setTimeout(() => {
        setShowMotivationalQuote(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [showMotivationalQuote])

  if (hasError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">This question needs review due to insufficient options.</p>
            <Button onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>Skip to Next Question</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <PageLoader />
  }

  if (quizCompleted) {
    const percentage = (score / questions.length) * 100
    const performanceMessage =
      percentage >= 90
        ? "Excellent work!"
        : percentage >= 70
          ? "Great job!"
          : percentage >= 50
            ? "Good effort!"
            : "Keep practicing!"

    // If not authenticated, show sign-in prompt instead of results
    if (!isAuthenticated) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] p-4 w-full"
        >
          <Card className="max-w-full w-full md:max-w-2xl shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
              <p className="text-muted-foreground mt-1">Please sign in to view your quiz results</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <SignInPrompt callbackUrl={`/dashboard/mcq/${slug}`} />
            </CardContent>
          </Card>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[50vh] p-4 w-full"
      >
        <Card className="max-w-full w-full md:max-w-2xl shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Quiz Completed!</CardTitle>
            <p className="text-muted-foreground mt-1">{performanceMessage}</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-center">
              <div className="bg-muted rounded-lg p-4 flex-1">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Time Taken</p>
                <p className="text-xl font-semibold">{formatTime(timeSpent)}</p>
              </div>
              <div className="bg-muted rounded-lg p-4 flex-1">
                <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-xl font-semibold">{Math.round(percentage)}%</p>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold mb-2">
                {score} / {questions.length}
              </div>
              <p className="text-muted-foreground">
                You answered {score} out of {questions.length} questions correctly
              </p>

              <div className="w-full bg-muted rounded-full h-4 mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Button onClick={() => window.location.reload()} size="lg" className="font-medium">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-full">
      <Card className="shadow-lg border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary font-medium px-3 py-1">
                Quiz
              </Badge>
              <h1 className="text-xl font-bold">The Ultimate Quiz on {title}</h1>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help bg-muted px-3 py-1 rounded-full">
                    <Timer className="w-4 h-4" />
                    {formatTime(timeSpent)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total time spent on the quiz</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2 w-full" />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <h2 className="text-lg font-semibold leading-tight">{currentQuestion?.question}</h2>
                </div>

                <RadioGroup
                  onValueChange={(value) => setSelectedAnswer(value)}
                  value={selectedAnswer || ""}
                  className="space-y-3 w-full mt-4"
                >
                  {uniqueOptions.map((option, index) => (
                    <motion.div
                      key={`${index}-${option}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                          "border-2",
                          selectedAnswer === option
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
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 pb-6 mt-6 flex-col-reverse md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Question time:{" "}
              {formatTime(timeSpent - (questionTimes.length > 0 ? questionTimes.reduce((a, b) => a + b, 0) : 0))}
            </span>
          </div>

          <Button
            onClick={nextQuestion}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full md:w-auto"
            size="lg"
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
        {showMotivationalQuote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <motion.div
              className="relative bg-gradient-to-r from-primary/90 to-primary/80 text-primary-foreground p-8 rounded-xl shadow-xl max-w-md text-center mx-4"
              initial={{ y: 50, scale: 0.8, opacity: 0 }}
              animate={{
                y: 0,
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                },
              }}
              exit={{
                y: 50,
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-full w-24 h-24 flex items-center justify-center text-4xl"
                initial={{ scale: 0, rotate: -30 }}
                animate={{
                  scale: 1,
                  rotate: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  },
                }}
              >
                {currentQuote.emoji}
              </motion.div>
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 0.3 },
                }}
              >
                <motion.p
                  className="text-xl font-medium leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.4, duration: 0.5 },
                  }}
                >
                  {currentQuote.text}
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </Card>
    </div>
  )
}

