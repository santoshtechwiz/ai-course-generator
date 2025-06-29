"use client"

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, Trash } from "lucide-react"
import type { DocumentQuestion } from "@/lib/quiz-store"

interface Props {
  questions: DocumentQuestion[]
  onSave: (questions: DocumentQuestion[]) => Promise<void>
  onUpdate: (questions: DocumentQuestion[]) => void
}

export default function DocumentQuizDisplay({ questions, onSave, onUpdate }: Props) {
  const update = (q: DocumentQuestion[]) => onUpdate(q)

  const handleQuestionChange = (i: number, val: string) => {
    const q = [...questions]
    q[i].question = val
    update(q)
  }

  const handleOptionChange = (qi: number, oi: number, val: string) => {
    const q = [...questions]
    q[qi].options[oi] = val
    update(q)
  }

  const handleCorrectChange = (qi: number, oi: number) => {
    const q = [...questions]
    q[qi].correctAnswer = oi
    update(q)
  }

  const addOption = (qi: number) => {
    const q = [...questions]
    q[qi].options.push("")
    update(q)
  }

  const removeOption = (qi: number, oi: number) => {
    const q = [...questions]
    q[qi].options.splice(oi, 1)
    update(q)
  }

  const removeQuestion = (i: number) => {
    const q = [...questions]
    q.splice(i, 1)
    update(q)
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <Card key={q.id}>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Question {qi + 1}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(qi)}>
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={q.question} onChange={(e) => handleQuestionChange(qi, e.target.value)} />
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <Input value={opt} onChange={(e) => handleOptionChange(qi, oi, e.target.value)} />
                <input
                  type="radio"
                  checked={q.correctAnswer === oi}
                  onChange={() => handleCorrectChange(qi, oi)}
                />
                <span className="text-sm">Correct</span>
                {q.options.length > 2 && (
                  <Button size="icon" variant="ghost" onClick={() => removeOption(qi, oi)}>
                    <Trash className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={() => addOption(qi)} size="sm" variant="outline">
              <Plus className="mr-2 w-4 h-4" />
              Add Option
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
