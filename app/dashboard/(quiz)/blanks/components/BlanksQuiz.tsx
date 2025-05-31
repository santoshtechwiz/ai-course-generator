"use client"

import type React from "react"

import { useState, useEffect, useCallback, memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"
import type { BlankQuestion } from "./types"

interface BlanksQuizProps {
  question: BlankQuestion
  questionNumber: number
  totalQuestions: number
  existingAnswer?: string
  onAnswer: (answer: string) => boolean
}

// Use memo to prevent unnecessary re-renders
const BlanksQuiz = memo(function BlanksQuiz({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer = "",
  onAnswer,
}: BlanksQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer || "")
  const [isFocused, setIsFocused] = useState(false)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)

  // Extract parts of the question before and after the blank
  const questionParts = question.question?.split("________") || []
  const beforeBlank = questionParts[0] || ""
  const afterBlank = questionParts[1] || ""

  // When existingAnswer prop changes (e.g. from Redux), update local state
  useEffect(() => {
    if (existingAnswer && existingAnswer !== answer) {
      setAnswer(existingAnswer)
      setIsAnswered(true)
    }
  }, [existingAnswer, answer])

  // Handle answer changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value)
  }, [])

  // Handle submission on blur or enter key
  const handleSubmit = useCallback(() => {
    if (answer.trim()) {
      const success = onAnswer(answer)
      if (success) {
        setIsAnswered(true)
      }
    }
  }, [answer, onAnswer])

  // Handle key press for form accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={`overflow-hidden ${isAnswered ? "border-success/30" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-medium">
              {questionNumber}
            </span>
            <Label className="ml-3 text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </Label>
            {isAnswered && (
              <span className="ml-auto">
                <CheckCircle className="h-5 w-5 text-success" />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-lg">{beforeBlank}</span>
            <div className="relative min-w-[150px] max-w-full">
              <Input
                className={`px-3 py-2 border-dashed ${
                  isFocused ? "border-primary" : isAnswered ? "border-success/50" : "border-muted-foreground"
                }`}
                placeholder="Type your answer..."
                value={answer}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false)
                  handleSubmit()
                }}
                onKeyDown={handleKeyDown}
                aria-label="Fill in the blank answer"
              />
            </div>
            <span className="text-lg">{afterBlank}</span>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">Fill in the blank with the appropriate term</div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

export default BlanksQuiz
