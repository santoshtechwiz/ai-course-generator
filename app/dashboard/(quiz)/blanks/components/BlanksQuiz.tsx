"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, ArrowLeft, Flag, Lightbulb, Target, Zap } from "lucide-react"
import type { BlankQuestion } from "./types"

interface BlanksQuizProps {
  question: BlankQuestion
  questionNumber: number
  totalQuestions: number
  existingAnswer?: string
  onAnswer: (answer: string) => boolean
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
}

function calculateEnhancedSimilarity(input: string, target: string) {
  if (!input || !target) return { score: 0, isPartialMatch: false, feedback: "poor" as const }

  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim()
  const a = normalize(input)
  const b = normalize(target)

  if (a === b) return { score: 100, isPartialMatch: true, feedback: "perfect" }

  const levDist = (() => {
    const matrix = Array.from({ length: b.length + 1 }, (_, j) => Array(a.length + 1).fill(0))
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j
    for (let j = 1; j <= b.length; j++)
      for (let i = 1; i <= a.length; i++)
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        )
    return matrix[b.length][a.length]
  })()

  const simScore = (1 - levDist / Math.max(a.length, b.length)) * 100
  const wordSim = (() => {
    const aWords = a.split(" "), bWords = b.split(" ")
    const match = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw))).length
    return (match / Math.max(aWords.length, bWords.length)) * 100
  })()

  const final = Math.round(simScore * 0.6 + wordSim * 0.4)
  const feedback = final >= 95 ? "perfect" : final >= 80 ? "excellent" : final >= 60 ? "good" : final >= 40 ? "fair" : "poor"
  return { score: final, isPartialMatch: final >= 40, feedback }
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const BlanksQuiz = memo(function BlanksQuiz({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer = "",
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
}: BlanksQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [isFocused, setIsFocused] = useState(false)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)

  const debouncedAnswer = useDebounce(answer, 500)

  const similarity = useMemo(() => calculateEnhancedSimilarity(answer, question.answer || ""), [answer, question.answer])

  const questionParts = question.question?.split("________") || ["", ""]
  const before = questionParts[0]
  const after = questionParts[1]
  const progress = (questionNumber / totalQuestions) * 100
  const canProceed = answer.trim() && similarity.isPartialMatch
  const maxHint = question.hints?.length || 4

  useEffect(() => {
    if (debouncedAnswer.trim() && debouncedAnswer !== existingAnswer) {
      setIsAnswered(true)
      onAnswer(debouncedAnswer)
    }
  }, [debouncedAnswer, onAnswer, existingAnswer])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value)
    setShowValidation(false)
    setAttemptCount(a => a + 1)
  }, [])

  const handleNext = useCallback(() => {
    if (!canProceed) return setShowValidation(true)
    if (onAnswer(answer) && onNext) onNext()
    setHintLevel(0); setShowHint(false)
  }, [answer, onAnswer, onNext, canProceed])

  const handleSubmit = useCallback(() => {
    if (!canProceed) return setShowValidation(true)
    if (onAnswer(answer) && onSubmit) onSubmit()
  }, [answer, onAnswer, onSubmit, canProceed])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      isLastQuestion ? handleSubmit() : handleNext()
    }
  }, [handleNext, handleSubmit, isLastQuestion])

  const generateHint = useCallback(() => {
    const answerText = question.answer?.trim()
    if (!answerText) return "Consider the context."
    if (question.hints?.length) return question.hints[Math.min(hintLevel, question.hints.length - 1)]

    const words = answerText.split(" ")
    const firstLetter = answerText[0]
    const isPhrase = words.length > 1
    const lengthHint = answerText.length > 8 ? "longer than 8 characters" : "short and concise"
    const defaultHints = [
      `It starts with \"${firstLetter.toUpperCase()}\"`,
      `It's ${isPhrase ? `${words.length} words` : "a single word"}`,
      `It's ${lengthHint}`,
      `It's similar to: \"${words[0]}...\"`
    ]
    return defaultHints[Math.min(hintLevel, defaultHints.length - 1)]
  }, [question.answer, question.hints, hintLevel])

  const feedback = {
    perfect: { color: "text-green-600", bg: "bg-green-50", icon: "🎯" },
    excellent: { color: "text-blue-600", bg: "bg-blue-50", icon: "⭐" },
    good: { color: "text-yellow-600", bg: "bg-yellow-50", icon: "👍" },
    fair: { color: "text-orange-600", bg: "bg-orange-50", icon: "🤔" },
    poor: { color: "text-gray-600", bg: "bg-gray-50", icon: "💭" },
  }[similarity.feedback]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-border/50 shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {questionNumber}
              </span>
              <div>
                <Label className="text-lg font-semibold">Question {questionNumber} of {totalQuestions}</Label>
                <p className="text-sm text-muted-foreground mt-1">Fill in the blank</p>
              </div>
            </div>
            {isAnswered && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" /> {similarity.score}%
                </Badge>
                <CheckCircle className="h-6 w-6 text-success" />
              </motion.div>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="mb-6 text-xl">
            {before} <Input
              value={answer}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Your answer"
              className="inline-block px-4 py-2 border-2 border-dashed"
              aria-label="Blank answer"
              autoFocus
            /> {after}
            {showValidation && !canProceed && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive mt-1">
                {!answer.trim() ? "Enter an answer" : "Answer doesn't match well enough"}
              </motion.p>
            )}
          </div>

          <AnimatePresence>
            {answer.trim() && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`mb-6 p-4 rounded-lg border ${feedback.bg}`}>
                <div className="flex justify-between items-center">
                  <div className={`flex items-center gap-2 ${feedback.color}`}>
                    <span>{feedback.icon}</span>
                    <span className="font-medium">{similarity.feedback}</span>
                    <Badge variant="outline" className="text-xs">{similarity.score}%</Badge>
                  </div>
                  <Zap className={`h-4 w-4 ${feedback.color}`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {attemptCount >= 2 && (
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowHint(!showHint)
                  if (!showHint) setHintLevel(h => Math.min(h + 1, maxHint - 1))
                }}
              >
                <Lightbulb className="h-4 w-4" /> {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
              {showHint && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <Lightbulb className="h-4 w-4 text-blue-600 inline mr-1" />
                  <span className="text-sm text-blue-800">{generateHint()}</span>
                </motion.div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <div>{canGoPrevious && <Button variant="outline" onClick={onPrevious}><ArrowLeft className="w-4 h-4" /> Previous</Button>}</div>
            <div>
              {!isLastQuestion ? (
                <Button onClick={handleNext} disabled={!canProceed} className="min-w-[120px]">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed} className="bg-success hover:bg-success/90 min-w-[140px]">
                  <Flag className="w-4 h-4" /> Finish Quiz
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

export default BlanksQuiz