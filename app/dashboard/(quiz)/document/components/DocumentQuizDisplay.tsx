"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Save, Plus, Trash } from "lucide-react"
import { QuizLoader } from "@/components/ui/quiz-loader"


interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface DocumentQuizDisplayProps {
  questions: Question[]
  onSave: (questions: Question[]) => void
  onUpdate: (questions: Question[]) => void
  isLoading?: boolean
}

export function DocumentQuizDisplay({
  questions: initialQuestions,
  onSave,
  onUpdate,
  isLoading = false,
}: DocumentQuizDisplayProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [isSaving, setIsSaving] = useState(false)

  const handleQuestionChange = (index: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index].question = value
    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleCorrectAnswerChange = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].correctAnswer = optionIndex
    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options.push("")
    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options.splice(optionIndex, 1)

    // If we're removing the correct answer or an option before it, adjust the correct answer index
    if (optionIndex <= updatedQuestions[questionIndex].correctAnswer) {
      updatedQuestions[questionIndex].correctAnswer = Math.max(
        0,
        updatedQuestions[questionIndex].correctAnswer -
          (optionIndex === updatedQuestions[questionIndex].correctAnswer ? 1 : 0),
      )
    }

    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: "",
      options: ["", ""],
      correctAnswer: 0,
    }
    const updatedQuestions = [...questions, newQuestion]
    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions.splice(index, 1)
    setQuestions(updatedQuestions)
    onUpdate(updatedQuestions)
  }

  const handleSaveQuiz = async () => {
    // Validate questions
    const invalidQuestions = questions.filter(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim()) || q.options.length < 2,
    )

    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid Questions",
        description: "All questions must have a question text and at least 2 non-empty options.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(questions)
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Add loading state handling
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <QuizLoader message="Loading quiz content..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {questions.map((question, questionIndex) => (
        <Card key={question.id} className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-medium">Question {questionIndex + 1}</CardTitle>
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveQuestion(questionIndex)}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Enter question"
                value={question.question}
                onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Options</div>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`q${questionIndex}-o${optionIndex}`}
                      name={`q${questionIndex}-correct`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => handleCorrectAnswerChange(questionIndex, optionIndex)}
                      className="h-4 w-4 text-primary"
                    />
                    <label htmlFor={`q${questionIndex}-o${optionIndex}`} className="text-xs">
                      Correct
                    </label>
                    {question.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                        className="h-6 w-6 text-destructive"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => handleAddOption(questionIndex)} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>

        <Button onClick={handleSaveQuiz} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Quiz"}
        </Button>
      </div>
    </div>
  )
}
