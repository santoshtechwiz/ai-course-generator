"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import levenshtein from "js-levenshtein"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, Clock, BookOpen, Lightbulb } from "lucide-react"

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

// Reusable Timer Component
const Timer = ({ elapsedTime }: { elapsedTime: number }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Time spent on this question</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Reusable BadgeGroup Component
const BadgeGroup = ({ tags, difficulty }: { tags: string[]; difficulty: string }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      <Badge variant="outline" className={`text-sm ${getDifficultyColor(difficulty)}`}>
        {difficulty}
      </Badge>
    </div>
  )
}

// Reusable ProgressBar Component
interface ProgressBarProps {
  progressPercentage: number
  questionNumber: number
  totalQuestions: number
}

const ProgressBar = ({ progressPercentage, questionNumber, totalQuestions }: ProgressBarProps) => (
  <div className="w-full mb-8">
    <Progress value={progressPercentage} className="h-2" />
    <div className="text-sm text-gray-600 mt-1">
      Question {questionNumber} of {totalQuestions}
    </div>
  </div>
)

export function FillInTheBlanksQuiz({ question, onAnswer, questionNumber, totalQuestions }: FillInTheBlanksQuizProps) {
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isValidInput, setIsValidInput] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)

  const similarityThreshold = 3
  const minimumPrefixLength = 2
  const progressPercentage = (questionNumber / totalQuestions) * 100

  const questionParts = useMemo(() => {
    const parts = question.question.split("_____")
    return parts.length === 2 ? parts : [question.question, ""]
  }, [question.question])

  const progressiveHints = useMemo(() => {
    const correctAnswer = question.answer.toLowerCase()
    const hintSteps = Math.ceil(correctAnswer.length / 3)
    const hints = []

    for (let i = 1; i <= hintSteps; i++) {
      const revealedLength = Math.floor((i / hintSteps) * correctAnswer.length)
      hints.push(correctAnswer.slice(0, revealedLength).padEnd(correctAnswer.length, "_"))
    }

    return [`The answer has ${correctAnswer.length} characters.`, ...hints, ...question.openEndedQuestion.hints]
  }, [question.answer, question.openEndedQuestion.hints])

  useEffect(() => {
    setAnswer("")
    setShowHints(Array(progressiveHints.length).fill(false))
    setSubmitted(false)
    setIsCorrect(false)
    setIsValidInput(false)
    setElapsedTime(0)
    setHintLevel(0)
  }, [question.id, progressiveHints])

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

    const distance = levenshtein(userInput, correctAnswer)
    setIsValidInput(distance <= similarityThreshold || correctAnswer.startsWith(userInput))
  }

  const handleSubmit = () => {
    const distance = levenshtein(answer.trim().toLowerCase(), question.answer.trim().toLowerCase())
    const isAnswerCorrect = distance <= similarityThreshold
    setIsCorrect(isAnswerCorrect)
    setSubmitted(true)
    onAnswer(answer)
  }

  const handleProgressiveHint = () => {
    if (hintLevel < progressiveHints.length) {
      setShowHints((prev) => {
        const newHints = [...prev]
        newHints[hintLevel] = true
        return newHints
      })
      setHintLevel((prev) => prev + 1)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <ProgressBar
        progressPercentage={progressPercentage}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
      />

      <div className="mb-8">
        <div className="text-lg font-medium leading-relaxed">
          {questionParts[0]}
          <span className="inline-block min-w-[100px] border-b-2 border-dashed mx-1 text-center">
            <Input
              value={answer}
              onChange={(e) => handleInputChange(e.target.value)}
              className="border-none text-center focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-300 font-semibold"
              placeholder="Type your answer here"
              disabled={submitted}
            />
          </span>
          {questionParts[1]}
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center p-3 rounded-md mb-6 ${
            isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          {isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          )}
          <span className={isCorrect ? "text-green-700" : "text-red-700"}>
            {isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${question.answer}`}
          </span>
        </motion.div>
      )}

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
                className="bg-blue-50 border border-blue-200 rounded p-2 mb-4"
              >
                <p className="text-sm text-blue-700">{progressiveHints[hIndex]}</p>
              </motion.div>
            ),
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={handleProgressiveHint}
          disabled={hintLevel >= progressiveHints.length || submitted}
        >
          <Lightbulb className="w-4 h-4 mr-1" />
          Get Hint
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValidInput || submitted}
          className="w-full max-w-xs transition-colors duration-300 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  )
}