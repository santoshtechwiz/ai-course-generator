"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

import { QuizDisplay } from "@/components/features/document/quiz-display"
import { DocumentQuizOptions } from "@/components/features/document/quiz-options"
import { FileUpload } from "@/components/features/document/FileUpload"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizOptionsType {
  numberOfQuestions: number
  difficulty: number
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOptionsType>({
    numberOfQuestions: 5,
    difficulty: 50,
  })
  const [quiz, setQuiz] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
  }

  const handleOptionsChange = (options: QuizOptionsType) => {
    setQuizOptions(options)
  }

  const handleGenerateQuiz = async () => {
    if (!file) return

    setIsLoading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("numberOfQuestions", quizOptions.numberOfQuestions.toString())
    formData.append("difficulty", quizOptions.difficulty.toString())

    try {
      const response = await fetch("/api/document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const quizData = await response.json()
      setQuiz(quizData.map((q: any, index: number) => ({ ...q, id: `generated-${index}` })))
      toast({
        title: "Quiz Generated",
        description: "Your quiz has been successfully generated. You can now edit the questions.",
      })
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveQuiz = async (questions: Question[]) => {
    try {
      const response = await fetch("/api/save-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quiz: questions }),
      })

      if (!response.ok) {
        throw new Error("Failed to save quiz")
      }

      toast({
        title: "Quiz Saved",
        description: "Your quiz has been successfully saved to the database.",
      })
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateQuiz = (updatedQuestions: Question[]) => {
    setQuiz(updatedQuestions)
  }

  return (
    <main className="container mx-auto p-4">
      {/* <h1 className="text-3xl font-bold mb-6">AI Quiz Generator</h1> */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUpload onFileSelect={handleFileSelect} />
            <DocumentQuizOptions onOptionsChange={handleOptionsChange} />
            <Button onClick={handleGenerateQuiz} disabled={!file || isLoading} className="w-full">
              {isLoading ? "Generating..." : "Generate Quiz"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            {quiz.length > 0 ? (
              <QuizDisplay questions={quiz} onSave={handleSaveQuiz} onUpdate={handleUpdateQuiz} />
            ) : (
              <p className="text-center text-muted-foreground">No quiz generated yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}