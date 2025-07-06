"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"

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
        <SubscriptionSlider
          value={options.numberOfQuestions}
          onValueChange={(value) => handleChange("numberOfQuestions", value)}
        />
      </div>      <div>
        <Label>Difficulty</Label>
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={100}
            value={options.difficulty}
            onChange={(e) => handleChange("difficulty", parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Easy</span>
            <span>Medium</span>
            <span>Hard</span>
          </div>
        </div>
      </div>
    </div>
  )
}
