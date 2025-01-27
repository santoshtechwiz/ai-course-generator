"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import levenshtein from "js-levenshtein"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2, HelpCircle, Clock, BookOpen } from "lucide-react"

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
  const [isCorrect, setIsCorrect] = useState(false)
  const [isValidInput, setIsValidInput] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const similarityThreshold = 3
  const minimumPrefixLength = 3

  useEffect(() => {
    setAnswer("")
    setShowHints(Array(question.openEndedQuestion.hints.length).fill(false))
    setSubmitted(false)
    setIsCorrect(false)
    setIsValidInput(false)
    setElapsedTime(0)
  }, [question])

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleInputChange = (value: string) => {
    setAnswer(value)
    const userInput = value.trim().toLowerCase()
    const correctAnswer = question.answer.trim().toLowerCase()

    if (userInput.length < minimumPrefixLength) {
      setIsValidInput(false)
      return
    }

    const prefixMatch = correctAnswer.startsWith(userInput.slice(0, minimumPrefixLength))
    if (prefixMatch) {
      const distance = levenshtein(userInput, correctAnswer)
      setIsValidInput(distance <= similarityThreshold)
    } else {
      setIsValidInput(false)
    }
  }

  const toggleHint = (hintIndex: number) => {
    setShowHints((prev) => prev.map((show, idx) => (idx === hintIndex ? !show : show)))
  }

  const handleSubmit = () => {
    const distance = levenshtein(answer.trim().toLowerCase(), question.answer.trim().toLowerCase())
    const isAnswerCorrect = distance <= similarityThreshold
    setIsCorrect(isAnswerCorrect)
    setSubmitted(true)
    onAnswer(answer)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="w-full bg-gray-200 rounded-t-lg h-2">
        <div
          className="bg-primary h-2 rounded-t-lg transition-all duration-300 ease-in-out"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        ></div>
      </div>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-primary" />
          <CardTitle className="text-xl font-bold">Fill in the Blanks</CardTitle>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{formatTime(elapsedTime)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time spent on this question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-semibold">{question.question}</h3>
            <div className="flex flex-wrap gap-2">
              {question.openEndedQuestion.tags.map((tag, tIndex) => (
                <Badge key={tIndex} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              value={answer}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-full transition-colors duration-300 ${
                submitted
                  ? isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : isValidInput
                    ? "border-blue-500"
                    : ""
              }`}
              disabled={submitted}
              placeholder="Type your answer here"
              aria-label="Answer input"
            />
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center mt-2"
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                  {isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${question.answer}`}
                </span>
              </motion.div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {question.openEndedQuestion.hints.map((hint, hIndex) => (
              <TooltipProvider key={hIndex}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs transition-colors duration-300 ${
                        showHints[hIndex] ? "bg-blue-100 text-blue-800" : ""
                      }`}
                      onClick={() => toggleHint(hIndex)}
                    >
                      <HelpCircle className="w-4 h-4 mr-1" />
                      Hint {hIndex + 1}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showHints[hIndex] ? "Hide hint" : "Show hint"}</p>
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
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!isValidInput || submitted}
          className="w-full transition-colors duration-300"
        >
          {submitted ? "Submitted" : "Submit Answer"}
        </Button>
      </CardFooter>
    </Card>
  )
}

