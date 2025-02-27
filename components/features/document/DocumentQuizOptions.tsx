"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface DocumentQuizOptionsProps {
  onOptionsChange: (options: DocumentQuizOptions) => void
}

export interface DocumentQuizOptions {
  numberOfQuestions: number
  difficulty: number
}

export function DocumentQuizOptions({ onOptionsChange }: DocumentQuizOptionsProps) {
  const [options, setOptions] = useState<DocumentQuizOptions>({
    numberOfQuestions: 5,
    difficulty: 50,
  })

  const handleChange = (key: keyof DocumentQuizOptions, value: number) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    onOptionsChange(newOptions)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="numberOfQuestions">Number of Questions</Label>
        <Input
          id="numberOfQuestions"
          type="number"
          min="1"
          max="20"
          value={options.numberOfQuestions}
          onChange={(e) => handleChange("numberOfQuestions", Number.parseInt(e.target.value))}
        />
      </div>
      <div>
        <Label>Difficulty</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[options.difficulty]}
          onValueChange={(value) => handleChange("difficulty", value[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Easy</span>
          <span>Medium</span>
          <span>Hard</span>
        </div>
      </div>
    </div>
  )
}

