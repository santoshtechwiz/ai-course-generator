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
      </div>

      <div>
        <Label>Difficulty</Label>
        <SubscriptionSlider
         
        
       
          value={options.difficulty}
          onValueChange={(value) => handleChange("difficulty", value)}
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
