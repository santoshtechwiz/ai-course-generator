"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LightbulbIcon, SendIcon, CheckCircleIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizQuestionProps {
  question: {
    id: number
    question: string
    answer: string
    openEndedQuestion: {
      hints: string | string[]
      difficulty: string
      tags: string | string[]
      inputType: string
    }
  }
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

export default function OpenEndedQuizQuestion({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)

  const hints = Array.isArray(question.openEndedQuestion.hints)
    ? question.openEndedQuestion.hints
    : question.openEndedQuestion.hints.split("|")

  useEffect(() => {
    setShowHints(Array(hints.length).fill(false))
    setHintLevel(0)
    setAnswer("") // Reset answer when question changes
  }, [question.id, hints.length])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 300)) // Animation delay
    onAnswer(answer)
    setIsSubmitting(false)
  }

  const handleProgressiveHint = () => {
    if (hintLevel < hints.length) {
      setShowHints((prev) => {
        const newHints = [...prev]
        newHints[hintLevel] = true
        return newHints
      })
      setHintLevel((prev) => prev + 1)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <motion.div
      key={question.id} // Important: Add key to ensure proper animation when question changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-primary">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="font-medium text-foreground">Question {questionNumber}</span>
                <ChevronRightIcon className="h-4 w-4" />
                <span>{totalQuestions}</span>
              </motion.div>
            </div>
            <Badge
              variant="secondary"
              className={cn("text-white", getDifficultyColor(question.openEndedQuestion.difficulty))}
            >
              {question.openEndedQuestion.difficulty}
            </Badge>
          </div>
          <motion.h2
            className="text-2xl font-bold leading-tight text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {question.question}
          </motion.h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
          />
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleProgressiveHint}
              disabled={hintLevel >= hints.length}
              className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground"
            >
              <LightbulbIcon className="w-4 h-4 mr-2" />
              {hintLevel === 0 ? "Get Hint" : `Next Hint (${hintLevel}/${hints.length})`}
            </Button>
            <AnimatePresence>
              {showHints.map(
                (show, index) =>
                  show && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/10 p-2 rounded mt-2">
                        <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{hints[index]}</span>
                      </div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || isSubmitting}
            className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              <>
                <SendIcon className="w-4 h-4 mr-2" />
                Submit Answer
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

