"use client"

import { useState, useCallback, useMemo, useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

interface Option {
  id: string
  text: string
}

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: (string | { id: string; text: string })[]
  }
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  isLastQuestion?: boolean
  existingAnswer?: string
  onNavigate?: (direction: "next" | "prev") => void
}

const McqQuiz = ({
  question,
  onAnswer,
  isSubmitting,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  existingAnswer,
  onNavigate,
}: McqQuizProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)
  const [isAnswerSaved, setIsAnswerSaved] = useState(!!existingAnswer)

  // Use the question text field or fall back to the question field
  const questionText = question.text || question.question || "Question text unavailable"

  // Update selected option when existingAnswer changes
  useEffect(() => {
    if (existingAnswer) {
      setSelectedOption(existingAnswer)
      setIsAnswerSaved(true)
    } else {
      setIsAnswerSaved(false)
    }
  }, [existingAnswer, question.id])

  const options = useMemo(() => {
    if (!question?.options || !Array.isArray(question.options)) return []

    return question.options.map((option, index) => {
      if (typeof option === "string") {
        return { id: option, text: option }
      }
      if (option && typeof option === "object" && option.id && option.text) {
        return option
      }
      // Fallback for malformed options
      return { id: `option_${index}`, text: String(option || `Option ${index + 1}`) }
    })
  }, [question?.options])

  const handleSubmit = useCallback(() => {
    if (!selectedOption || isSubmitting) return

    // Pass the selected option to the parent component
    onAnswer(selectedOption)
    setIsAnswerSaved(true)
  }, [selectedOption, isSubmitting, onAnswer])

  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOption(optionId)
    setIsAnswerSaved(false)
  }, [])

  // Add this function to directly handle navigation
  const handleDirectNavigation = useCallback((direction: "next" | "prev") => {
    console.log(`Direct navigation button clicked: ${direction}`);
    onNavigate?.(direction);
  }, [onNavigate]);

  // Validate question data
  if (!question || (!questionText) || !options.length) {
    return (
      <Card className="w-full shadow-md border border-border/60">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Question data is not available</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Reload Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-md border border-border/60">
      <CardHeader>
        <CardTitle>{questionText}</CardTitle>
        <CardDescription>
          Question {questionNumber} of {totalQuestions}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <RadioGroup value={selectedOption || ""} onValueChange={handleOptionSelect}>
          {options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
              <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitting} />
              <Label 
                htmlFor={option.id} 
                className="flex-grow cursor-pointer py-1"
              >
                {option.text}
              </Label>
              {selectedOption === option.id && isAnswerSaved && (
                <Check size={16} className="text-green-500" />
              )}
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-center mt-4">
          {!isAnswerSaved ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedOption || isSubmitting}
            >
              Save Answer
            </Button>
          ) : (
            <p className="text-sm text-green-600">Answer saved!</p>
          )}
        </div>

        {/* Separate navigation buttons as direct actions */}
        <div className="flex justify-between mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => handleDirectNavigation('prev')}
            disabled={questionNumber === 1 || isSubmitting}
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </Button>
          
          {!isLastQuestion ? (
            <Button
              variant="outline"
              onClick={() => handleDirectNavigation('next')}
              disabled={isSubmitting}
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => onNavigate?.('next')}
              disabled={isSubmitting || !isAnswerSaved}
            >
              Finish Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default McqQuiz
