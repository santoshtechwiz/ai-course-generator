"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Quiz = {
  id: number
  question: string
  answer: string
  options: string
}

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [newQuiz, setNewQuiz] = useState<Partial<Quiz>>({})
  const [isAddingQuiz, setIsAddingQuiz] = useState(false)

  useEffect(() => {
    // Fetch quizzes from your API
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/admin/quizzes")
        const data = await response.json()
        setQuizzes(data)
      } catch (error) {
        console.error("Failed to fetch quizzes:", error)
      }
    }

    fetchQuizzes()
  }, [])

  const handleAddQuiz = async () => {
    try {
      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuiz),
      })
      const addedQuiz = await response.json()
      setQuizzes([...quizzes, addedQuiz])
      setNewQuiz({})
      setIsAddingQuiz(false)
    } catch (error) {
      console.error("Failed to add quiz:", error)
    }
  }

  const handleDeleteQuiz = async (id: number) => {
    try {
      await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" })
      setQuizzes(quizzes.filter((quiz) => quiz.id !== id))
    } catch (error) {
      console.error("Failed to delete quiz:", error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quizzes</h2>
        <Dialog open={isAddingQuiz} onOpenChange={setIsAddingQuiz}>
          <DialogTrigger asChild>
            <Button>Add Quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Quiz</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question" className="text-right">
                  Question
                </Label>
                <Input
                  id="question"
                  value={newQuiz.question || ""}
                  onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="answer" className="text-right">
                  Answer
                </Label>
                <Input
                  id="answer"
                  value={newQuiz.answer || ""}
                  onChange={(e) => setNewQuiz({ ...newQuiz, answer: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="options" className="text-right">
                  Options
                </Label>
                <Textarea
                  id="options"
                  value={newQuiz.options || ""}
                  onChange={(e) => setNewQuiz({ ...newQuiz, options: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter options separated by commas"
                />
              </div>
            </div>
            <Button onClick={handleAddQuiz}>Add Quiz</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Answer</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quizzes.map((quiz) => (
            <TableRow key={quiz.id}>
              <TableCell>{quiz.question}</TableCell>
              <TableCell>{quiz.answer}</TableCell>
              <TableCell>{quiz.options}</TableCell>
              <TableCell>
                <Button variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

