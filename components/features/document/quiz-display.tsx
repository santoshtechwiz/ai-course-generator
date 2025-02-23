"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { QuizPDF } from "./quiz-pdf"
import { PlusCircle, Trash2 } from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizDisplayProps {
  questions: Question[]
  onSave: (questions: Question[]) => Promise<void>
  onUpdate: (questions: Question[]) => void
}

export function QuizDisplay({ questions, onSave, onUpdate }: QuizDisplayProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(questions)
    setIsSaving(false)
  }

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updatedQuestions = [...questions]
    if (field === "options") {
      updatedQuestions[index].options = (value as string).split(",").map((option) => option.trim())
    } else {
      updatedQuestions[index][field] = value
    }
    onUpdate(updatedQuestions)
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    }
    onUpdate([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    onUpdate(updatedQuestions)
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Question {index + 1}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              value={question.question}
              onChange={(e) => updateQuestion(index, "question", e.target.value)}
              placeholder="Enter question"
              className="mb-4"
            />
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <Input
                  key={optionIndex}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...question.options]
                    newOptions[optionIndex] = e.target.value
                    updateQuestion(index, "options", newOptions.join(","))
                  }}
                  placeholder={`Option ${optionIndex + 1}`}
                />
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Correct Answer:</label>
              <Input
                type="number"
                min="1"
                max="4"
                value={question.correctAnswer + 1}
                onChange={(e) => updateQuestion(index, "correctAnswer", Number.parseInt(e.target.value) - 1)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={addQuestion} className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Question
      </Button>
      <div className="flex space-x-4">
        <PDFDownloadLink document={<QuizPDF questions={questions} />} fileName="generated_quiz.pdf">
          {({ blob, url, loading, error }) => (
            <Button disabled={loading}>{loading ? "Generating PDF..." : "Download PDF"}</Button>
          )}
        </PDFDownloadLink>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save to Database"}
        </Button>
      </div>
    </div>
  )
}

