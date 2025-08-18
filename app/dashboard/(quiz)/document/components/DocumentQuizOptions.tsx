"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, Target, Brain } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DocumentQuizOptionsProps {
  onOptionsChange: (options: DocumentQuizOptions) => void
  disabled?: boolean
}

export interface DocumentQuizOptions {
  numberOfQuestions: number
  difficulty: number
}

const questionOptions = [
  { value: 3, label: "3 questions", description: "Quick quiz" },
  { value: 5, label: "5 questions", description: "Standard quiz" },
  { value: 10, label: "10 questions", description: "Comprehensive quiz" },
  { value: 15, label: "15 questions", description: "Extended quiz" },
  { value: 20, label: "20 questions", description: "Full assessment" },
]

const difficultyOptions = [
  { value: 25, label: "Easy", description: "Basic comprehension questions", color: "text-emerald-600 dark:text-emerald-400" },
  { value: 50, label: "Medium", description: "Moderate analysis required", color: "text-amber-600 dark:text-amber-500" },
  { value: 75, label: "Hard", description: "Deep understanding needed", color: "text-destructive" },
]

export function DocumentQuizOptions({ onOptionsChange, disabled = false }: DocumentQuizOptionsProps) {
  const [options, setOptions] = useState<DocumentQuizOptions>({
    numberOfQuestions: 5,
    difficulty: 50,
  })

  const handleChange = (key: keyof DocumentQuizOptions, value: number) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    onOptionsChange(newOptions)
  }

  const selectedDifficulty = difficultyOptions.find((d) => d.value === options.difficulty)
  const selectedQuestionCount = questionOptions.find((q) => q.value === options.numberOfQuestions)

  return (
    <Card className={`transition-opacity ${disabled ? "opacity-50" : ""}`}>
      <CardContent className="p-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <Label htmlFor="numberOfQuestions" className="text-sm font-medium">
              Number of Questions
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>More questions provide better coverage but use more credits</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Select
            value={options.numberOfQuestions.toString()}
            onValueChange={(value) => handleChange("numberOfQuestions", Number.parseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select number of questions" />
            </SelectTrigger>
            <SelectContent>
              {questionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedQuestionCount && (
            <p className="text-xs text-muted-foreground">
              {selectedQuestionCount.description} • Estimated processing time:{" "}
              {Math.ceil(options.numberOfQuestions / 5)} minute(s)
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <Label htmlFor="difficulty" className="text-sm font-medium">
              Difficulty Level
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Difficulty affects question complexity and depth</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Select
            value={options.difficulty.toString()}
            onValueChange={(value) => handleChange("difficulty", Number.parseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select difficulty level" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex flex-col">
                    <span className={`font-medium ${option.color}`}>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedDifficulty && (
            <p className={`text-xs ${selectedDifficulty.color}`}>{selectedDifficulty.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
