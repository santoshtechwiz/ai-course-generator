"use client"

import { useMemo, useCallback, useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { HelpCircle, ArrowRight, Clock, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import {  formatQuizTime } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAnimation } from "@/providers/animation-provider"
import { MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { useQuiz } from "@/app/context/QuizContext"
import type { Question } from "./types"
import { cn } from "@/lib/tailwindUtils"

interface McqQuizProps {
  question: Question
  onAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
}

export default function McqQuiz({ question, onAnswer, questionNumber, totalQuestions }: McqQuizProps) {
  // Refs to prevent unnecessary re-renders
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // State
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { animationsEnabled } = useAnimation()
  const { state } = useQuiz()
  const isCompleting = state.animationState === "completing"
  const [questionAvailable, setQuestionAvailable] = useState(!!question)

  useEffect(() => {
    setQuestionAvailable(!!question)
  }, [question])

  // Add this check at the beginning of the component
  if (!questionAvailable) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">This question is not available.</p>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Reset timer and selection when question changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const startTimer = () => {
      startTimeRef.current = Date.now()
      setElapsedTime(0)

      intervalId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
      timerRef.current = intervalId
    }

    const clearTimer = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
        timerRef.current = null
      }
    }

    setSelectedOption(null)
    setIsSubmitting(false)
    clearTimer()

    startTimer()

    return () => {
      clearTimer()
    }
  }, [question?.id])

  // Generate options from question data - memoized to prevent recalculation
  const options = useMemo(() => {
    if (!question) return []

    // Define a set of fallback options we can use if needed
    const fallbackOptions = [
      "True",
      "False",
      "All of the above",
      "None of the above",
      "It depends on the context",
      "This is not determinable from the information given",
      "Both A and B",
      "Neither A nor B",
      "Sometimes",
      "Always",
      "Never",
      "Rarely",
      "Often",
      "Possibly",
      "Definitely not",
    ]

    // Use pre-processed options array if available
    const allOptions = [question.answer, question.option1, question.option2, question.option3].filter(Boolean)

    // Create a Set to remove duplicates
    const uniqueOptions = [...new Set(allOptions)]

    // Ensure the answer is included
    if (question.answer && !uniqueOptions.includes(question.answer)) {
      uniqueOptions.unshift(question.answer)
    }

    // If we have fewer than 2 unique options, add fallbacks
    if (uniqueOptions.length < 2) {
      // Add fallback options that are different from existing options
      let i = 0
      while (uniqueOptions.length < 4 && i < fallbackOptions.length) {
        if (!uniqueOptions.includes(fallbackOptions[i])) {
          uniqueOptions.push(fallbackOptions[i])
        }
        i++
      }
    }

    // Shuffle options with a stable seed based on question ID
    let seed = Number.parseInt(question.id) || 0
    return [...uniqueOptions].sort(() => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x) - 0.5
    })
  }, [question])

  // Memoized handlers
  const handleSelectOption = useCallback((value: string) => {
    setSelectedOption(value)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!selectedOption || !question || isSubmitting) return

    setIsSubmitting(true)

    // Determine if the selected option is correct
    const isCorrect = selectedOption === question.answer

    // Get final elapsed time
    const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)

    // Pass the answer data to the parent component
    setTimeout(() => {
      onAnswer(selectedOption, finalTime, isCorrect)
      setIsSubmitting(false)
    }, 300) // Small delay for better UX
  }, [selectedOption, question, onAnswer, isSubmitting])

  // If no question is available

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatQuizTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <MotionTransition key={question.id} motionKey={String(question.id)}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-semibold" id="question-text">
                  {question.question}
                </h2>
              </div>
              <RadioGroup
                value={selectedOption || ""}
                onValueChange={handleSelectOption}
                className="space-y-3 w-full mt-4"
                aria-labelledby="question-text"
              >
                {options.map((option, index) => (
                  <motion.div
                    key={`${question.id}-${index}-${option}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.1,
                      duration: 0.3,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      animate={
                        isCompleting && selectedOption === option
                          ? {
                              scale: [1, 1.05, 1],
                              transition: { duration: 0.5 },
                            }
                          : {}
                      }
                    >
                      <div
                        className={cn(
                          "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                          "border-2",
                          selectedOption === option
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/80",
                        )}
                        onClick={() => handleSelectOption(option)}
                      >
                        <RadioGroupItem value={option} id={`option-${question.id}-${index}`} />
                        <Label
                          htmlFor={`option-${question.id}-${index}`}
                          className="flex-grow cursor-pointer font-medium text-sm sm:text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </MotionTransition>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-mono">{formatQuizTime(elapsedTime)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time spent on this question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {questionNumber > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* Previous handled by parent */
              }}
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className="w-full sm:w-auto"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Submitting...</span>
            </div>
          ) : (
            <>
              {questionNumber === totalQuestions ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
