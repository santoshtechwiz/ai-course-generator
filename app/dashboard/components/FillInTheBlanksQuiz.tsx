"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string[]
    difficulty: string
    tags: string[]
    inputType: string
  }
}

interface FillInTheBlanksQuizProps {
  question: Question
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

export function FillInTheBlanksQuiz({ question, onAnswer, questionNumber, totalQuestions }: FillInTheBlanksQuizProps) {
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setAnswer("")
    setShowHints(Array(question.openEndedQuestion.hints.length).fill(false))
    setSubmitted(false)
  }, [question])

  const handleInputChange = (value: string) => {
    setAnswer(value)
  }

  const toggleHint = (hintIndex: number) => {
    setShowHints((prev) => prev.map((show, idx) => (idx === hintIndex ? !show : show)))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    onAnswer(answer)
  }

  const isCorrect = () => {
    return answer.toLowerCase() === question.answer.toLowerCase()
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Fill in the Blanks Quiz</CardTitle>
        <CardDescription>
          Question {questionNumber} of {totalQuestions}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Question {questionNumber}</h3>
              <div className="flex space-x-2">
                {question.openEndedQuestion.tags.map((tag, tIndex) => (
                  <Badge key={tIndex} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-base">{question.question}</p>
            <Input
              type="text"
              value={answer}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-full ${
                submitted ? (isCorrect() ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50") : ""
              }`}
              disabled={submitted}
              placeholder="Type your answer here"
            />
            {submitted && (
              <div className="flex items-center mt-2">
                {isCorrect() ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className={isCorrect() ? "text-green-700" : "text-red-700"}>
                  {isCorrect() ? "Correct!" : `Incorrect. The correct answer is: ${question.answer}`}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {question.openEndedQuestion.hints.map((hint, hIndex) => (
                <TooltipProvider key={hIndex}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => toggleHint(hIndex)}>
                        <HelpCircle className="w-4 h-4 mr-1" />
                        Hint {hIndex + 1}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{hint}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <AnimatePresence>
              {showHints.map(
                (show, hIndex) =>
                  show && (
                    <motion.div
                      key={hIndex}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-blue-50 border border-blue-200 rounded p-2 mt-2"
                    >
                      <p className="text-sm text-blue-700">{question.openEndedQuestion.hints[hIndex]}</p>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSubmit} disabled={submitted}>
          {submitted ? "Submitted" : "Submit Answer"}
        </Button>
      </CardFooter>
    </Card>
  )
}

