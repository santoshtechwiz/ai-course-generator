"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  RefreshCw,
  Home,
  Download,
  Share2,
  AlertCircle,
  BookOpen,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useMemo, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Confetti } from "@/components/ui/confetti"

interface QuizAnswer {
  questionId: string | number
  answer?: string
  selectedOption?: string
  selectedOptionId?: string
  isCorrect?: boolean
  userAnswer?: string
}

interface QuizQuestion {
  id: string | number
  question?: string
  text?: string
  options: string[] | { id: string; text: string }[]
  answer?: string
  correctAnswer?: string
  correctOptionId?: string
}

interface QuizResult {
  quizId: string | number
  slug: string
  title: string
  questions?: QuizQuestion[] | null
  questionResults?: any[]
  answers?: QuizAnswer[] | null
  completedAt: string
  score: number
  maxScore: number
  percentage: number
}

interface McqQuizResultProps {
  result: QuizResult
}

function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding knowledge! You've mastered this topic.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      emoji: "🏆",
      gradient: "from-emerald-500 to-emerald-600",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      emoji: "🎯",
      gradient: "from-blue-500 to-blue-600",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      emoji: "✅",
      gradient: "from-green-500 to-green-600",
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      emoji: "📚",
      gradient: "from-yellow-500 to-yellow-600",
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      emoji: "💪",
      gradient: "from-orange-500 to-orange-600",
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    emoji: "📖",
    gradient: "from-red-500 to-red-600",
  }
}

export default function McqQuizResult({ result }: McqQuizResultProps) {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  const [showConfetti, setShowConfetti] = useState(false)

  const questions = result.questions || []
  const answers = result.answers || []
  const questionResults = result.questionResults || []
  const hasQuestionDetails = questions.length > 0 || questionResults.length > 0
  const quizSlug = result.slug || result.quizId || ""

  const performance = useMemo(() => getPerformanceLevel(result.percentage), [result.percentage])

  useEffect(() => {
    if (result.percentage >= 70) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result.percentage])

  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const expandAll = useCallback(() => {
    if (!hasQuestionDetails) return
    const expanded: Record<string, boolean> = {}
    if (questions.length > 0) {
      questions.forEach((q) => {
        if (q?.id) expanded[q.id.toString()] = true
      })
    } else if (questionResults.length > 0) {
      questionResults.forEach((qr, index) => {
        expanded[qr.questionId?.toString() || index.toString()] = true
      })
    }
    setExpandedQuestions(expanded)
  }, [hasQuestionDetails, questions, questionResults])

  const collapseAll = useCallback(() => {
    setExpandedQuestions({})
  }, [])

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: `${result.title} - Quiz Results`,
        text: `I scored ${result.percentage}% (${performance.level}) on the ${result.title} quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast.success("Results copied to clipboard!")
      } else {
        toast.error("Sharing not supported")
      }
    } catch {
      toast.error("Failed to share results")
    }
  }, [result.title, result.percentage, performance.level, performance.emoji])

  const handleDownload = useCallback(() => {
    const resultText = `
Quiz Results: ${result.title}
Date: ${new Date(result.completedAt).toLocaleString()}
Score: ${result.score}/${result.maxScore} (${result.percentage}%)
Performance: ${performance.level} ${performance.emoji}

${
  hasQuestionDetails
    ? `Detailed Results:
${(questions.length > 0 ? questions : questionResults)
  .map((item, i) => {
    let questionText, userAnswerText, correctAnswerText, isCorrect
    if (questions.length > 0) {
      const q = item
      const userAnswer = answers.find((a) => a?.questionId?.toString() === q?.id?.toString())
      isCorrect = userAnswer?.isCorrect ?? false
      questionText = q.question || q.text || `Question ${i + 1}`
      userAnswerText =
        userAnswer?.userAnswer ||
        userAnswer?.selectedOption ||
        userAnswer?.selectedOptionId ||
        userAnswer?.answer ||
        "Not answered"
      correctAnswerText = q.correctAnswer || q.answer || q.correctOptionId || "Answer unavailable"
    } else {
      const qr = item
      isCorrect = qr.isCorrect ?? false
      questionText = qr.question || qr.text || `Question ${i + 1}`
      userAnswerText = qr.userAnswer || qr.selectedOption || "Not answered"
      correctAnswerText = qr.correctAnswer || "Answer unavailable"
    }
    return `
Q${i + 1}: ${questionText}
Your answer: ${userAnswerText}
Correct answer: ${correctAnswerText}
Result: ${isCorrect ? "Correct ✓" : "Incorrect ✗"}
`
  })
  .join("\n")}`
    : "No detailed results available."
}
    `.trim()
    const blob = new Blob([resultText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.title.replace(/\s+/g, "-").toLowerCase()}-results.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Results downloaded!")
  }, [result, performance, hasQuestionDetails, questions, questionResults, answers])

  // Error state
  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6"
      >
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Unable to Load Results</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load your quiz results. The session may have expired or some data might be missing.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
          <Home className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </motion.div>
    )
  }

  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto relative">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center"
            >
              <BookOpen className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              >
                {result.title}
              </motion.h1>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Badge
                  variant="secondary"
                  className={`mt-3 text-lg px-4 py-2 ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {performance.emoji} {performance.level}
                </Badge>
              </motion.div>
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Completed on {new Date(result.completedAt).toLocaleDateString()} at{" "}
            {new Date(result.completedAt).toLocaleTimeString()}
          </motion.p>
        </motion.div>

        {/* Enhanced Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="overflow-hidden shadow-2xl border-2 border-primary/20">
            <CardHeader className={`bg-gradient-to-r ${performance.gradient} text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      <Trophy className="w-10 h-10 text-white" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-3xl font-bold text-white">Quiz Results</CardTitle>
                      <CardDescription className="text-white/90 text-lg">Your performance summary</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                      className="text-6xl font-bold text-white"
                    >
                      {result.percentage}%
                    </motion.div>
                    <div className="text-white/90 text-lg">
                      {result.score} of {result.maxScore}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Progress</span>
                    <span className="font-bold">
                      {result.score}/{result.maxScore} correct
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 1 }}
                  >
                    <Progress value={result.percentage} className="h-4 bg-muted/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.percentage}%` }}
                        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${performance.gradient} rounded-full`}
                      />
                    </Progress>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className={`p-6 rounded-xl border-2 ${performance.bgColor} ${performance.borderColor}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{performance.emoji}</span>
                    <div>
                      <p className={`font-bold text-lg ${performance.color}`}>{performance.level} Performance!</p>
                      <p className={`${performance.color} opacity-90`}>{performance.message}</p>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Correct", value: result.score, color: "emerald", icon: Check },
                    { label: "Incorrect", value: result.maxScore - result.score, color: "red", icon: X },
                    { label: "Total", value: result.maxScore, color: "blue", icon: Target },
                    {
                      label: "Accuracy",
                      value: `${Math.round((result.score / result.maxScore) * 100)}%`,
                      color: "purple",
                      icon: TrendingUp,
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 + index * 0.1 }}
                      className={`bg-${stat.color}-50 dark:bg-${stat.color}-950/30 border border-${stat.color}-200 dark:border-${stat.color}-800 rounded-xl p-4 text-center`}
                    >
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600 mx-auto mb-2`} />
                      <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex flex-wrap gap-3 justify-between p-6">
              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => router.push(`/dashboard/mcq/${quizSlug}`)} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retake Quiz
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")} className="gap-2">
                    <Home className="w-4 h-4" />
                    All Quizzes
                  </Button>
                </motion.div>
              </div>
              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </motion.div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Enhanced Question Review */}
        {hasQuestionDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl">Answer Review</CardTitle>
                      <CardDescription>
                        {questions.length > 0 ? questions.length : questionResults.length} Questions • Review your
                        answers and learn from mistakes
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={expandAll} className="gap-1">
                      <ChevronDown className="w-4 h-4" />
                      Expand All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll} className="gap-1">
                      <ChevronUp className="w-4 h-4" />
                      Collapse All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {(questions.length > 0 ? questions : questionResults).map((item, index) => {
                  let questionData, answer, isCorrect, questionText, questionId
                  if (questions.length > 0) {
                    questionData = item
                    questionId = questionData?.id?.toString() || index.toString()
                    answer = answers.find(
                      (a) => a && questionData && a.questionId?.toString() === questionData.id?.toString(),
                    )
                    isCorrect = answer?.isCorrect || false
                    questionText = questionData.question || questionData.text || `Question ${index + 1}`
                  } else {
                    const qr = item
                    questionId = qr.questionId?.toString() || index.toString()
                    questionData = qr
                    answer = qr
                    isCorrect = qr.isCorrect || false
                    questionText = qr.question || qr.text || `Question ${index + 1}`
                  }
                  if (!questionData) return null
                  const isExpanded = expandedQuestions[questionId]

                  return (
                    <motion.div
                      key={questionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleQuestion(questionId)}
                        className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                          isCorrect
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30"
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                                  isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                }`}
                              >
                                {isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg">Question {index + 1}</h3>
                                <p className="text-muted-foreground text-sm truncate">{questionText}</p>
                              </div>
                              <Badge variant={isCorrect ? "default" : "destructive"} className="text-sm px-3 py-1">
                                {isCorrect ? "Correct" : "Incorrect"}
                              </Badge>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-2 ml-4">
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Review
                                  </>
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="px-5 pb-6 space-y-6 border-t bg-card/50"
                          >
                            <div className="pt-4">
                              <h4 className="font-semibold text-lg mb-4">{questionText}</h4>
                              {questionData.options &&
                                Array.isArray(questionData.options) &&
                                questionData.options.length > 0 && (
                                  <div className="mb-6">
                                    <h5 className="font-medium text-sm mb-3 text-muted-foreground">Options:</h5>
                                    <div className="space-y-3">
                                      {questionData.options.map((option, optIndex) => {
                                        const optionText = typeof option === "string" ? option : option.text
                                        const optionId = typeof option === "string" ? option : option.id
                                        const isUserSelected =
                                          answer?.selectedOptionId === optionId || answer?.selectedOption === optionText
                                        const isCorrectOption =
                                          questionData.correctOptionId === optionId ||
                                          questionData.correctAnswer === optionText ||
                                          questionData.answer === optionText
                                        return (
                                          <motion.div
                                            key={optIndex}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: optIndex * 0.1 }}
                                            className={`p-4 rounded-lg border-2 text-sm transition-all ${
                                              isCorrectOption
                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100"
                                                : isUserSelected
                                                  ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100"
                                                  : "bg-muted/50 border-muted"
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              {isCorrectOption && <Check className="w-5 h-5 text-emerald-600" />}
                                              {isUserSelected && !isCorrectOption && (
                                                <X className="w-5 h-5 text-red-600" />
                                              )}
                                              <span className="flex-1">{optionText}</span>
                                              <div className="flex gap-2">
                                                {isUserSelected && (
                                                  <Badge variant="outline" size="sm" className="text-xs">
                                                    Your choice
                                                  </Badge>
                                                )}
                                                {isCorrectOption && (
                                                  <Badge
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-emerald-100 dark:bg-emerald-900 text-xs"
                                                  >
                                                    Correct
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </motion.div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              <div className="space-y-4">
                                <div
                                  className={`p-4 rounded-lg border-2 ${
                                    isCorrect
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                                      : "bg-muted border-muted-foreground/20"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isCorrect ? "bg-emerald-500 text-white" : "bg-muted-foreground/20"
                                      }`}
                                    >
                                      Y
                                    </div>
                                    <span className="font-semibold">Your answer:</span>
                                  </div>
                                  <p className="text-sm pl-9">
                                    {answer?.userAnswer ||
                                      answer?.selectedOption ||
                                      answer?.selectedOptionId ||
                                      answer?.answer ||
                                      "Not answered"}
                                  </p>
                                </div>
                                {!isCorrect && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700"
                                  >
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                        <Check className="w-4 h-4" />
                                      </div>
                                      <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                                        Correct answer:
                                      </span>
                                    </div>
                                    <p className="text-sm pl-9 text-emerald-700 dark:text-emerald-300">
                                      {questionData.correctAnswer ||
                                        questionData.answer ||
                                        questionData.correctOptionId ||
                                        "Answer unavailable"}
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!hasQuestionDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">Question Details Not Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your score has been recorded, but detailed question review is not available for this quiz session.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <AnimatePresence>{showConfetti && <Confetti isActive />}</AnimatePresence>
    </>
  )
}
