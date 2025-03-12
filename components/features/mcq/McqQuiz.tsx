"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, AlertTriangle, Timer, HelpCircle, RefreshCcw, Trophy, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { submitQuizData } from "@/app/actions/actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageLoader from "@/components/ui/loader"
import { SignInPrompt } from "@/components/SignInPrompt"

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
}

export default function McqQuiz({ questions, quizId, slug }: McqQuizProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentQuestion = questions[currentQuestionIndex]
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [showMotivationalQuote, setShowMotivationalQuote] = useState(false)
  const [currentQuote, setCurrentQuote] = useState("")

  const motivationalQuotes = [
    "✨ Every mistake is a step toward success.",
    "🚀 The only true failure is giving up.",
    "💪 Your persistence is your measure of faith in yourself.",
    "🌟 Success is stumbling from failure to failure with no loss of enthusiasm.",
    "🌱 The expert in anything was once a beginner.",
    "🏆 Progress, not perfection.",
    "🧠 Challenges are what make life interesting.",
    "⚡ The harder you work for something, the greater you'll feel when you achieve it.",
    "⏱️ Don't watch the clock; do what it does. Keep going.",
    "✅ Believe you can and you're halfway there.",
    "🔥 Your potential is endless. Keep going!",
    "🌈 Every expert was once a beginner.",
    "💡 The difference between ordinary and extraordinary is practice.",
    "🛠️ Skill comes from consistent effort and learning.",
    "🌊 Small progress is still progress.",
  ]

  const saveQuizResults = useCallback(
    async (quizData: any) => {
      try {
        setLoading(true)
        await submitQuizData({
          slug,
          quizId,
          answers: quizData.answers,
          elapsedTime: quizData.totalTime,
          score: quizData.score,
          type: "mcq",
        })
        setLoading(false)
        // Clear the stored results after successful submission
        localStorage.removeItem("quizResults")
      } catch (error) {
        console.error("Failed to update quiz score:", error)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to update quiz score. Please try again.",
          variant: "destructive",
        })
      }
    },
    [slug, quizId],
  )

  const handleQuizCompletion = useCallback(() => {
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
      saveQuizResults(quizData)
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
          saveQuizResults(quizData)
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
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Question Error</h2>
            <p className="text-muted-foreground mb-4">This question needs review due to insufficient options.</p>
            <Button onClick={nextQuestion}>Skip to Next Question</Button>
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

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-[50vh] p-4 w-full"
      >
        <Card className="max-w-full w-full md:max-w-2xl shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-2"
            >
              <Trophy className="w-16 h-16 text-yellow-500" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h2 className="text-2xl font-bold">Quiz Completed!</h2>
              <p className="text-muted-foreground mt-1">{performanceMessage}</p>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-center">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-muted rounded-lg p-4 flex-1"
              >
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Time Taken</p>
                <p className="text-xl font-semibold">{formatTime(timeSpent)}</p>
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-muted rounded-lg p-4 flex-1"
              >
                <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-xl font-semibold">{Math.round(percentage)}%</p>
              </motion.div>
            </div>

            {isAuthenticated ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-primary/10 rounded-lg p-6 text-center"
              >
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
                    transition={{ delay: 0.7, duration: 1 }}
                    className="h-full bg-primary"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <SignInPrompt callbackUrl={`/dashboard/mcq/${slug}`} />
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            {isAuthenticated && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button onClick={() => window.location.reload()} size="lg" className="font-medium">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retake Quiz
                </Button>
              </motion.div>
            )}
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
              <h1 className="text-xl sm:text-2xl font-bold">Interactive Challenge</h1>
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
                <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg">
                  <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold leading-tight">{currentQuestion?.question}</h2>
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
                      whileHover={{ scale: 1.01 }}
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

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
          </motion.div>
        </CardFooter>
        {showMotivationalQuote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: { duration: 0.2 },
            }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              className="bg-gradient-to-r from-primary/90 to-primary/80 text-primary-foreground p-6 rounded-lg shadow-lg max-w-md text-center mx-auto backdrop-blur-sm"
              initial={{ y: 20 }}
              animate={{
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                },
              }}
              whileInView={{
                boxShadow: ["0 0 0 0 rgba(var(--primary), 0.7)", "0 0 0 10px rgba(var(--primary), 0)"],
                transition: {
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                },
              }}
            >
              <motion.p
                className="text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 0.2 },
                }}
              >
                {currentQuote}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </Card>
    </div>
  )
}

