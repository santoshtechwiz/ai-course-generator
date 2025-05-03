"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

import { shuffleArray, isAnswerCorrect } from "@/lib/utils/quiz-options"
import { isTooFastAnswer } from "@/lib/utils/quiz-performance"
import { cn } from "@/lib/tailwindUtils"

interface McqQuizProps {
  question: {
    id: string | number
    question: string
    answer: string
    option1?: string
    option2?: string
    option3?: string
    options?: string[] // Support for direct options array
  }
  onAnswer: (answer: string, timeSpent: number, isCorrect: boolean) => void
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
}

export default function McqQuiz({ question, onAnswer, questionNumber, totalQuestions, isLastQuestion }: McqQuizProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [startTime] = useState<number>(Date.now())
  const [options, setOptions] = useState<string[]>([])
  const [tooFastWarning, setTooFastWarning] = useState<boolean>(false)

  // Set up options when question changes
  useEffect(() => {
    // Get all valid options - either from options array or from individual properties
    let allOptions: string[] = []

    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      // Use the options array if available
      allOptions = [...question.options]
    } else {
      // Otherwise, collect from individual properties
      const optionsArray = [question.answer]
      if (question.option1) optionsArray.push(question.option1)
      if (question.option2) optionsArray.push(question.option2)
      if (question.option3) optionsArray.push(question.option3)
      allOptions = optionsArray.filter(Boolean)
    }

    // Ensure we have at least one option
    if (allOptions.length === 0) {
      console.error("No options available for question:", question)
      allOptions = ["No options available"]
    }

    // Shuffle options using the utility function
    const shuffled = shuffleArray(allOptions)
    setOptions(shuffled)

    // Reset selected option when question changes
    setSelectedOption(null)
    setTooFastWarning(false)
  }, [question])

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
    setTooFastWarning(false)
  }

  const handleSubmit = () => {
    if (!selectedOption) return

    // Calculate time spent
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    // Check if answer was submitted too quickly (potential cheating)
    if (isTooFastAnswer(startTime, 1)) {
      setTooFastWarning(true)
      return
    }

    // Check if answer is correct using the utility function
    const isCorrect = isAnswerCorrect(selectedOption, question.answer)

    // Call the onAnswer callback
    onAnswer(selectedOption, timeSpent, isCorrect)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Question {questionNumber}/{totalQuestions}
        </h2>
        <span className="text-gray-500">Multiple Choice</span>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-6">{question.question}</h3>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-md p-4 cursor-pointer transition-all",
                selectedOption === option ? "border-primary bg-primary/5" : "hover:bg-gray-50",
              )}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center mr-3",
                    selectedOption === option ? "border-primary" : "border-gray-300",
                  )}
                >
                  {selectedOption === option && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tooFastWarning && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-amber-600 text-sm">
          Please take time to read the question carefully before answering.
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">{selectedOption ? "" : "Select an answer to continue"}</div>
        <Button onClick={handleSubmit} disabled={!selectedOption} className="px-8">
          {isLastQuestion ? "Submit Quiz" : "Next"}
        </Button>
      </div>
    </div>
  )
}
