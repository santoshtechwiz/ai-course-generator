"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Confetti } from "@/components/ui/confetti"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Flame, RefreshCw, Clock, CheckCircle, HelpCircle, XCircle, Share2, BookOpen } from "lucide-react"

interface FlashCardQuestion {
  id: number
  question: string
  answer: string
}

interface FlashCardAnswer {
  questionId: number
  answer: string
}

interface FlashCardResult {
  correctAnswers: number
  incorrectAnswers: number
  stillLearningAnswers: number
  totalQuestions: number
  percentage: number
  totalTime: number
  questions: FlashCardQuestion[]
  answers: FlashCardAnswer[]
  reviewCards?: number[]
  stillLearningCards?: number[]
}

interface FlashCardResultsProps {
  slug: string
  title?: string
  result: FlashCardResult
  onRestart?: () => void
  onReview?: (ids: number[]) => void
  onReviewStillLearning?: (ids: number[]) => void
}

export default function FlashCardResults({
  slug,
  title = "Flashcard Quiz",
  result,
  onRestart,
  onReview,
  onReviewStillLearning,
}: FlashCardResultsProps) {
  const router = useRouter()
  const [tab, setTab] = useState("correct")
  const [copied, setCopied] = useState(false)
  // Add local state to track cards for review
  const [reviewCardsState, setReviewCardsState] = useState<number[]>([])
  const [stillLearningCardsState, setStillLearningCardsState] = useState<number[]>([])
  // Add animation states
  const [reviewCardsCount, setReviewCardsCount] = useState(0)
  const [stillLearningCardsCount, setStillLearningCardsCount] = useState(0)
  const [hasUpdated, setHasUpdated] = useState(false)
  // Add confetti celebration when all cards are known
  const [showConfetti, setShowConfetti] = useState(false)

  const {
    correctAnswers = 0,
    incorrectAnswers = 0,
    stillLearningAnswers = 0,
    totalQuestions = 0,
    percentage = 0,
    totalTime = 0,
    questions = [],
    answers = [],
  } = result || {}

  // Update local state when result prop changes
  useEffect(() => {
    if (!result) return

    // Check if the counts have changed
    const newReviewCards = result.reviewCards || []
    const newStillLearningCards = result.stillLearningCards || []

    const reviewCountChanged = reviewCardsState.length !== newReviewCards.length
    const stillLearningCountChanged = stillLearningCardsState.length !== newStillLearningCards.length

    if (reviewCountChanged || stillLearningCountChanged) {
      // Set flag that values have updated to trigger animations
      setHasUpdated(true)

      // Reset after animation completes
      setTimeout(() => setHasUpdated(false), 1000)
    }

    // Update the state values
    setReviewCardsState(newReviewCards)
    setStillLearningCardsState(newStillLearningCards)
    setReviewCardsCount(newReviewCards.length)
    setStillLearningCardsCount(newStillLearningCards.length)
  }, [result])
  // Add confetti effect when all cards are known
  useEffect(() => {
    // Show confetti if there are no cards left to review and there were some before
    if (
      reviewCardsState.length === 0 &&
      stillLearningCardsState.length === 0 &&
      result &&
      ((result.reviewCards && result.reviewCards.length > 0) ||
        (result.stillLearningCards && result.stillLearningCards.length > 0))
    ) {
      setShowConfetti(true)

      // Hide confetti after a few seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [reviewCardsState.length, stillLearningCardsState.length, result])

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return "0.00s"
    if (seconds < 60) return `${seconds.toFixed(2)}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toFixed(2).padStart(5, "0")}`
  }

  const avgTime = totalQuestions > 0 ? Number((totalTime / totalQuestions).toFixed(2)) : 0

  const answerMap = useMemo(() => {
    const map: Record<number | string, string> = {}
    for (const a of answers) map[a.questionId] = a.answer
    return map
  }, [answers])

  const grouped = useMemo(
    () => ({
      correct: questions.filter((q) => answerMap[q.id] === "correct"),
      still_learning: questions.filter((q) => answerMap[q.id] === "still_learning"),
      incorrect: questions.filter((q) => answerMap[q.id] === "incorrect"),
    }),
    [questions, answerMap],
  )

  // Add this useEffect to update when the results change
  useEffect(() => {
    // Force a re-evaluation of the tabs when answers change
    if (answers && answers.length > 0) {
      setTab((prevTab) => prevTab) // This triggers a re-render without changing the tab
    }
  }, [answers])

  const performance = useMemo(() => {
    if (percentage >= 90) return { emoji: "🏆", title: "Mastery" }
    if (percentage >= 75) return { emoji: "🔥", title: "On Fire!" }
    if (percentage >= 50) return { emoji: "💪", title: "Getting There" }
    return { emoji: "🚀", title: "Keep Practicing" }
  }, [percentage])

  const tabs = [
    { key: "correct", label: "Known", icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
    { key: "still_learning", label: "Still Learning", icon: <HelpCircle className="w-4 h-4 text-yellow-500" /> },
    { key: "incorrect", label: "Did Not Know", icon: <XCircle className="w-4 h-4 text-red-600" /> },
  ]

  const handleShare = async () => {
    const shareData = {
      title: `${title} Quiz Results`,
      text: `I scored ${Math.round(percentage)}% on the "${title}" quiz!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch {
      console.warn("Share failed")
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Confetti celebration */}
      {showConfetti && <Confetti isActive={showConfetti} />}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-[var(--color-text)]/70 text-base mt-2">Quiz Complete!</p>
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-6xl">{performance.emoji}</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{performance.title}</div>
            <div className="text-lg text-muted-foreground">{Math.round(percentage)}% Score</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 dark:from-[var(--color-accent)]/20 dark:to-[var(--color-accent)]/10 border-2 border-[var(--color-accent)]/30 dark:border-[var(--color-accent)]/40 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex gap-3 items-center text-[var(--color-accent)] dark:text-[var(--color-accent)]">
              <div className="w-10 h-10 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)] rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-[var(--color-bg)]" />
              </div>
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <motion.div
              key={`percentage-${percentage}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] mb-2"
            >
              {Math.round(percentage)}%
            </motion.div>
            <p className="text-[var(--color-text)]/70">
              <motion.span
                key={`correct-count-${correctAnswers}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="font-semibold"
              >
                {correctAnswers}
              </motion.span>{" "}
              out of {totalQuestions} correct
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--color-success)]/10 to-[var(--color-success)]/5 dark:from-[var(--color-success)]/20 dark:to-[var(--color-success)]/10 border-2 border-[var(--color-success)]/30 dark:border-[var(--color-success)]/40 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex gap-3 items-center text-[var(--color-success)] dark:text-[var(--color-success)]">
              <div className="w-10 h-10 bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--color-bg)]" />
              </div>
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <div className="text-2xl font-bold text-[var(--color-success)] dark:text-[var(--color-success)]">{formatTime(totalTime)}</div>
            <p className="text-[var(--color-text)]/70 dark:text-[var(--color-text)]/70">
              <span className="font-semibold">{avgTime}s</span> average per card
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 dark:from-[hsl(var(--primary))]/20 dark:to-[hsl(var(--accent))]/20 border-2 border-[hsl(var(--primary))]/30 dark:border-[hsl(var(--primary))]/40 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))]">Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 text-center text-sm gap-4">
            <div className="space-y-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 mx-auto bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success)] rounded-full flex items-center justify-center"
              >
                <CheckCircle className="text-[var(--color-bg)] w-6 h-6" />
              </motion.div>
              <motion.div
                key={`correct-${correctAnswers}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold text-[var(--color-success)] dark:text-[var(--color-success)]"
              >
                {correctAnswers}
              </motion.div>
              <div className="text-xs text-[var(--color-text)]/70">Known</div>
            </div>
            <div className="space-y-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 mx-auto bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)] rounded-full flex items-center justify-center"
              >
                <HelpCircle className="text-[var(--color-bg)] w-6 h-6" />
              </motion.div>
              <motion.div
                key={`learning-${stillLearningAnswers}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold text-[var(--color-warning)] dark:text-[var(--color-warning)]"
              >
                {stillLearningAnswers}
              </motion.div>
              <div className="text-xs text-[var(--color-text)]/70">Learning</div>
            </div>
            <div className="space-y-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 mx-auto bg-gradient-to-r from-[var(--color-error)] to-[var(--color-error)] rounded-full flex items-center justify-center"
              >
                <XCircle className="text-[var(--color-bg)] w-6 h-6" />
              </motion.div>
              <motion.div
                key={`incorrect-${incorrectAnswers}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold text-[var(--color-error)] dark:text-[var(--color-error)]"
              >
                {incorrectAnswers}
              </motion.div>
              <div className="text-xs text-[var(--color-text)]/70">Need Study</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Review Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Tabs defaultValue="correct" value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3 max-w-2xl mx-auto h-12 bg-[var(--color-card)] border-2 border-[var(--color-border)] rounded-2xl p-1 shadow-neo">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="flex items-center gap-2 rounded-xl font-semibold transition-all duration-300 data-[state=active]:bg-[var(--color-accent)] data-[state=active]:text-[var(--color-bg)] data-[state=active]:shadow-neo"
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden text-xs">
                  {t.key === "correct" ? "Known" : t.key === "still_learning" ? "Learning" : "Study"}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-8 space-y-4">
              {grouped[t.key as keyof typeof grouped].length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                  <div className="text-4xl mb-4">
                    {t.key === "correct" ? "🎉" : t.key === "still_learning" ? "📚" : "🤔"}
                  </div>
                  <p className="text-[var(--color-text)]/70 text-base">No {t.label.toLowerCase()} cards yet</p>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {grouped[t.key as keyof typeof grouped].map((q: FlashCardQuestion, index: number) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold text-foreground leading-relaxed">
                            {q.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-[var(--color-card)] rounded-xl p-4 border-2 border-[var(--color-border)] shadow-neo">
                            <p className="text-[var(--color-text)] leading-relaxed">{q.answer}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="space-y-6 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-center text-xl font-semibold text-[var(--color-text)]">What's next?</h3>

        {/* Review Options */}
        {(reviewCardsState.length > 0 || stillLearningCardsState.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {onReviewStillLearning && stillLearningCardsState.length > 0 && (
              <motion.div
                animate={hasUpdated ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-2 border-[var(--color-warning)]/30 dark:border-[var(--color-warning)]/40 hover:border-[var(--color-warning)]/50 dark:hover:border-[var(--color-warning)]/60 transition-all duration-300 bg-gradient-to-br from-[var(--color-warning)]/10 to-[var(--color-warning)]/5 dark:from-[var(--color-warning)]/20 dark:to-[var(--color-warning)]/10 shadow-xl hover:shadow-2xl">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)] rounded-2xl flex items-center justify-center shadow-lg">
                      <HelpCircle className="h-8 w-8 text-[var(--color-bg)]" />
                    </div>
                    <div>
                      <motion.h3
                        className="text-xl font-bold text-[var(--color-text)] mb-2"
                        key={`still-learning-${stillLearningCardsCount}`}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        Review {stillLearningCardsCount} Learning Cards
                      </motion.h3>
                      <p className="text-[var(--color-text)]/70">Focus on cards you're still mastering</p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)] hover:from-[var(--color-warning)] hover:to-[var(--color-warning)] text-[var(--color-bg)] px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      onClick={() => onReviewStillLearning(stillLearningCardsState)}
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Practice These
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {onReview && reviewCardsState.length > 0 && (
              <motion.div
                animate={hasUpdated ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-2 border-[var(--color-error)]/30 dark:border-[var(--color-error)]/40 hover:border-[var(--color-error)]/50 dark:hover:border-[var(--color-error)]/60 transition-all duration-300 bg-gradient-to-br from-[var(--color-error)]/10 to-[var(--color-error)]/5 dark:from-[var(--color-error)]/20 dark:to-[var(--color-error)]/10 shadow-xl hover:shadow-2xl">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-[var(--color-error)] to-[var(--color-error)] rounded-2xl flex items-center justify-center shadow-lg">
                      <XCircle className="h-8 w-8 text-[var(--color-bg)]" />
                    </div>
                    <div>
                      <motion.h3
                        className="text-xl font-bold text-[var(--color-text)] mb-2"
                        key={`review-${reviewCardsCount}`}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        Study {reviewCardsCount} Difficult Cards
                      </motion.h3>
                      <p className="text-[var(--color-text)]/70">Focus on cards that need more attention</p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[var(--color-error)] to-[var(--color-error)] hover:from-[var(--color-error)] hover:to-[var(--color-error)] text-[var(--color-bg)] px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      onClick={() => onReview(reviewCardsState)}
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Study These
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* General Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onRestart}
              size="lg"
              variant="outline"
              className="px-8 py-3 rounded-2xl font-semibold border-2 border-border hover:border-primary transition-all duration-300 bg-transparent"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Restart Quiz
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              onClick={handleShare}
              size="lg"
              className="px-8 py-3 rounded-2xl font-semibold hover:bg-muted transition-all duration-300"
            >
              <Share2 className="w-5 h-5 mr-2" />
              {copied ? "Link Copied!" : "Share Results"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
