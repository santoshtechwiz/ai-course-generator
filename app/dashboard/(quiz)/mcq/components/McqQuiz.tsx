"use client"

import { useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { HelpCircle, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { cn, formatQuizTime } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAnimation } from "@/providers/animation-provider"
import { MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { QuizProgress } from "../../components/QuizProgress"
import { useEffect, useState, useRef } from "react"

interface McqQuizProps {
  question: {
    id: number
    question: string
    answer: string
    option1: string
    option2: string
    option3: string
  }
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
  const { animationsEnabled } = useAnimation()

  // Reset timer and selection when question changes
  useEffect(() => {
    startTimeRef.current = Date.now()
    setElapsedTime(0)
    setSelectedOption(null)

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [question?.id]) // Only reset when question ID changes

  // Generate options from question data - memoized to prevent recalculation
  const options = useMemo(() => {
    if (!question) return []

    // Collect all valid options
    const allOptions = [question.answer, question.option1, question.option2, question.option3].filter(Boolean)

    // If we have fewer than 2 options, add fallbacks
    if (new Set(allOptions).size < 2) {
      if (question.answer) {
        allOptions.push("None of the above")
        allOptions.push("All of the above")
      }
    }

    // Ensure we have unique options
    const uniqueOptions = [...new Set(allOptions)]

    // Shuffle options with a stable seed based on question ID
    let seed = question.id || 0
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
    if (!selectedOption || !question) return

    // Determine if the selected option is correct
    const isCorrect = selectedOption === question.answer

    // Get final elapsed time
    const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000)

    // Pass the answer data to the parent component
    onAnswer(selectedOption, finalTime, isCorrect)
  }, [selectedOption, question, onAnswer])

  // If no question is available
  if (!question) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question is not available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <QuizProgress
          currentQuestionIndex={questionNumber - 1}
          totalQuestions={totalQuestions}
          timeSpent={[elapsedTime]}
          title=""
          quizType="Multiple Choice"
          animate={animationsEnabled}
        />
      </CardHeader>
      <CardContent className="p-6">
        <MotionTransition key={question.id} motionKey={String(question.id)}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold">{question.question}</h2>
              </div>
              <RadioGroup
                value={selectedOption || ""}
                onValueChange={handleSelectOption}
                className="space-y-3 w-full mt-4"
              >
                {options.map((option, index) => (
                  <motion.div
                    key={`${question.id}-${index}-${option}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                        "border-2",
                        selectedOption === option ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                      )}
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
                ))}
              </RadioGroup>
            </div>
          </div>
        </MotionTransition>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">{formatQuizTime(elapsedTime)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Time spent on this question</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button onClick={handleSubmit} disabled={!selectedOption} className="w-full sm:w-auto">
          {questionNumber === totalQuestions ? "Finish Quiz" : "Next Question"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
