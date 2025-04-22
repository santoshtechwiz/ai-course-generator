"use client"

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
import { useState, useEffect, useMemo } from "react"

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
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())
  const { animationsEnabled } = useAnimation()

  // Debug the question data
  useEffect(() => {
    if (!question) {
      console.error("McqQuiz received null or undefined question")
    } else {
      console.log("McqQuiz received question:", question)

      // Check if the question has all required fields
      if (!question.id) console.warn("Question is missing id")
      if (!question.question) console.warn("Question is missing question text")
      if (!question.answer) console.warn("Question is missing correct answer")
      if (!question.option1 && !question.option2 && !question.option3) {
        console.warn("Question is missing all option fields")
      }
    }
  }, [question])

  // Update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => {
      clearInterval(timer) // Clean up the timer on component unmount
    }
  }, [startTime])

  // Improve the uniqueOptions useMemo to handle edge cases better
  const uniqueOptions = useMemo(() => {
    if (!question) {
      console.error("Cannot generate options for null question")
      return []
    }

    // Log the raw options for debugging
    console.log("Raw options:", {
      answer: question.answer,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
    })

    const allOptions = [question.answer, question.option1, question.option2, question.option3].filter(Boolean)
    console.log("Filtered options:", allOptions)

    // Check for duplicate options
    const uniqueOptionsSet = new Set(allOptions)
    console.log("Unique options count:", uniqueOptionsSet.size)

    if (uniqueOptionsSet.size < 2) {
      console.warn("Question has fewer than 2 unique options:", question)

      // Add fallback options if we don't have enough
      if (question.answer) {
        uniqueOptionsSet.add("None of the above")
        uniqueOptionsSet.add("All of the above")
        uniqueOptionsSet.add("Cannot be determined")
      } else {
        console.error("Question has no correct answer defined")
        return []
      }
    }

    if (uniqueOptionsSet.size < 4) {
      const fallbackOptions = [
        "None of the above",
        "All of the above",
        "Not enough information",
        "Cannot be determined",
      ]

      let i = 0
      while (uniqueOptionsSet.size < 4 && i < fallbackOptions.length) {
        uniqueOptionsSet.add(fallbackOptions[i])
        i++
      }
    }

    // Shuffle options consistently using a seed based on the question
    const shuffledOptions = [...uniqueOptionsSet].sort(() => Math.random() - 0.5)
    console.log("Final shuffled options:", shuffledOptions)
    return shuffledOptions
  }, [question])

  const handleSelectOption = (value: string) => {
    setSelectedOption(value)
  }

  // Update the handleSubmit function to correctly determine if the answer is correct
  const handleSubmit = () => {
    if (selectedOption) {
      // Check if the selected option is the correct answer
      const isCorrect = selectedOption === question.answer

      console.log("Submitting answer:", {
        selectedOption,
        correctAnswer: question.answer,
        isCorrect,
        elapsedTime,
      })

      onAnswer(selectedOption, elapsedTime, isCorrect)
      setSelectedOption(null) // Reset for next question
    }
  }

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
          quizType="Multiple Choice"
          animate={animationsEnabled}
        />
      </CardHeader>
      <CardContent className="p-6">
        <MotionTransition key={question.id} motionKey={""}>
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
                {uniqueOptions.map((option, index) => (
                  <motion.div
                    key={`${index}-${option}`}
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
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
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
          {questionNumber === totalQuestions ? (
            "Finish Quiz"
          ) : (
            <>
              Next Question
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
