"use client"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Trophy, Share2, RefreshCw, Home, Code } from "lucide-react"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Confetti } from "@/components/ui/confetti"
import type { RootState } from "@/store"

// Helper function to determine if a string looks like a slug/ID
const isSlugLike = (str: string): boolean => {
  if (!str || str.length < 3) return true
  const hasSpaces = str.includes(" ")
  const isShort = str.length < 10
  const hasRandomPattern = /^[a-zA-Z0-9]{6,}$/.test(str)
  return !hasSpaces && (isShort || hasRandomPattern)
}

// Smart title resolution
const getDisplayTitle = (quiz: any): string => {
  const possibleTitles = [
    quiz?.title,
    quiz?.name,
    quiz?.topic,
    quiz?.subject,
    quiz?.courseName,
    quiz?.quizTitle,
  ].filter(Boolean)

  for (const title of possibleTitles) {
    if (typeof title === "string" && !isSlugLike(title)) {
      return title
    }
  }
  return "Code Challenge Quiz"
}

const getDisplaySubtitle = (quiz: any): string | undefined => {
  const mainTitle = getDisplayTitle(quiz)
  if (mainTitle === "Code Challenge Quiz") {
    return quiz?.id || quiz?.slug || quiz?.title || undefined
  }
  return quiz?.description || quiz?.category || quiz?.language || undefined
}

function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "🏆",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
  }
}

interface CodeQuizResultProps {
  result?: any
  onRetake?: () => void
}

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps = {}) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)

  // Use result prop if provided, otherwise fall back to Redux state
  const quiz = result || useSelector((state: RootState) => state.quiz)

  // Calculate results
  const totalQuestions = Array.isArray(quiz.questions) ? quiz.questions.length : 0
  const correctAnswers = Array.isArray(quiz.questions) ? quiz.questions.filter((q: any) => q.isCorrect)?.length : 0
  const incorrectAnswers = totalQuestions - correctAnswers
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])

  // Format questions for display
  const formattedQuestions = useMemo(
    () =>
      quiz.questions?.map((question: any, index: number) => {
        const questionId = String(question.id || `question-${index}`)
        const answer = quiz.answers?.[questionId] || {}

        let userAnswer = null
        try {
          userAnswer = answer.userAnswer || answer.selectedOptionId || answer.text || question.userAnswer

          if (userAnswer === "") {
            if (answer.selectedOptionId) {
              userAnswer = answer.selectedOptionId
            } else {
              userAnswer = null
            }
          }

          if (!userAnswer && question.options && Array.isArray(question.options) && answer.selectedOptionId) {
            const selectedOption = question.options.find(
              (opt: any) => String(opt.id) === String(answer.selectedOptionId),
            )
            if (selectedOption?.text) {
              userAnswer = selectedOption.text
            }
          }
        } catch (e) {
          console.warn("Error extracting user answer:", e)
        }

        const correctAnswer = question.answer || question.correctCode || question.correctAnswer || ""

        const isCorrect = answer.isCorrect === true || question.isCorrect === true || false

        return {
          id: questionId,
          question: question.question || question.text || "",
          type: "code",
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation || question.hint || "",
          code: question.code || question.codeSnippet || "",
          language: question.language || "javascript",
        }
      }) || [],
    [quiz],
  )

  // Get smart title and subtitle
  const displayTitle = getDisplayTitle(quiz)
  const displaySubtitle = getDisplaySubtitle(quiz)

  useEffect(() => {
    if (quiz && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [quiz, percentage])

  const handleRetry = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else if (quiz.slug) {
      router.push(`/dashboard/code/${quiz.slug}`)
    } else {
      router.push("/dashboard/quizzes")
    }
  }, [onRetake, quiz.slug, router])

  const handleGoHome = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${displayTitle} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${displayTitle} code challenge! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  // Calculate time taken if available
  const timeTaken =
    (quiz as any).timeEnded && (quiz as any).timeStarted
      ? `${Math.round(((quiz as any).timeEnded - (quiz as any).timeStarted) / 1000 / 60)} minutes`
      : undefined

  return (
    <>
      <motion.div
        className="space-y-8 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Header */}
        <motion.div
          className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Code className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-left">
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {displayTitle}
              </motion.h1>
              <motion.div
                className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mt-2"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge
              variant="secondary"
              className={`mt-3 px-4 py-2 text-sm font-semibold shadow-md ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2`}
            >
              <motion.span
                className="mr-2 text-lg"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
              >
                {performance.emoji}
              </motion.span>
              {performance.level}
            </Badge>
          </motion.div>

          {displaySubtitle && (
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {displaySubtitle}
            </motion.p>
          )}
        </motion.div>

        {/* Score Overview */}
        <motion.div
          className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <CardHeader className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border-b-2 border-primary/10 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
                  <Trophy className="w-12 h-12 text-primary drop-shadow-lg" />
                </motion.div>
                <div>
                  <CardTitle className="text-3xl font-bold text-foreground">Your Score</CardTitle>
                  <p className="text-muted-foreground text-lg">Code challenge performance summary</p>
                </div>
              </div>
              <div className="text-right">
                <motion.div
                  className="text-6xl font-black text-primary drop-shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  {percentage}%
                </motion.div>
                <div className="text-lg text-muted-foreground font-medium">
                  {correctAnswers} of {totalQuestions}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-medium">
                  <span>Progress</span>
                  <motion.span
                    key={percentage}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {correctAnswers}/{totalQuestions} correct
                  </motion.span>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-4 rounded-full bg-muted/50" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                      repeatDelay: 1,
                    }}
                    style={{ opacity: percentage > 0 ? 1 : 0 }}
                  />
                </div>
              </div>

              <motion.div
                className={`p-6 rounded-2xl border-3 ${performance.bgColor} ${performance.borderColor} shadow-lg`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-4">
                  <motion.span
                    className="text-4xl"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                    }}
                  >
                    {performance.emoji}
                  </motion.span>
                  <p className={`font-bold text-xl ${performance.color}`}>{performance.message}</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="text-4xl font-black text-green-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    {correctAnswers}
                  </motion.div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Correct</div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-lg"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="text-4xl font-black text-red-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    {incorrectAnswers}
                  </motion.div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-semibold">Incorrect</div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-lg"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="text-4xl font-black text-slate-600 dark:text-slate-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    {totalQuestions}
                  </motion.div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Total</div>
                </motion.div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-t-2 border-muted/20 flex flex-wrap gap-4 justify-between p-8">
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleRetry}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                  Retake Quiz
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={handleGoHome}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
                >
                  <Home className="w-5 h-5" />
                  All Quizzes
                </Button>
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={handleShare}
                className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
              >
                <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ duration: 0.2 }}>
                  <Share2 className="w-5 h-5" />
                </motion.div>
                Share Results
              </Button>
            </motion.div>
          </CardFooter>
        </motion.div>

        {/* Question Results */}
        {formattedQuestions.length > 0 && (
          <motion.div
            className="rounded-3xl shadow-2xl border-2 border-muted/20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <CardHeader className="p-8 bg-gradient-to-r from-muted/10 to-muted/20 border-b-2 border-muted/20">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
                  <Code className="w-7 h-7 text-primary" />
                </motion.div>
                Answer Review ({formattedQuestions.length} Questions)
              </CardTitle>
              <p className="text-muted-foreground text-lg">Review your code solutions and learn from mistakes</p>
            </CardHeader>

            <CardContent className="space-y-6 p-8">
              {formattedQuestions.map((q, index) => (
                <motion.div
                  key={q.id}
                  className="p-6 rounded-2xl border-2 border-muted/30 bg-gradient-to-r from-background to-muted/5 shadow-lg hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        q.isCorrect ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
                      }`}
                    >
                      {q.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold mb-3 text-lg text-foreground">
                        Question {index + 1}: {q.question}
                      </div>

                      {q.code && (
                        <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border">
                          <pre className="text-sm overflow-x-auto">
                            <code className={`language-${q.language}`}>{q.code}</code>
                          </pre>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div
                          className={`p-4 rounded-xl border-2 shadow-md ${
                            q.isCorrect
                              ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                              : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-base">Your answer:</span>
                          </div>
                          <div className="pl-0">
                            <span
                              className={`text-base font-medium ${q.isCorrect ? "text-green-500" : "text-red-500"}`}
                            >
                              {q.userAnswer || "(no answer)"}
                            </span>
                          </div>
                        </div>

                        {!q.isCorrect && (
                          <motion.div
                            className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 shadow-md"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-base">Correct answer:</span>
                            </div>
                            <p className="text-base font-medium text-green-500 pl-8">{q.correctAnswer}</p>
                          </motion.div>
                        )}

                        {q.explanation && (
                          <motion.div
                            className="text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg border border-muted/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <strong>Explanation:</strong> {q.explanation}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </motion.div>
        )}
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
