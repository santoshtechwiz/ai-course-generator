"use client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface MCQOption {
  id: string
  text: string
  isCorrect?: boolean
}

interface MCQQuestionProps {
  question: string
  options: MCQOption[]
  selectedOption?: string
  onSelectOption: (optionId: string) => void
  showCorrectAnswer?: boolean
  explanation?: string
  className?: string
}

export const MCQQuestion = ({
  question,
  options,
  selectedOption,
  onSelectOption,
  showCorrectAnswer = false,
  explanation,
  className,
}: MCQQuestionProps) => {
  const handleChange = (value: string) => {
    onSelectOption(value)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-lg font-medium text-gray-900 dark:text-white">{question}</div>

      <RadioGroup value={selectedOption} onValueChange={handleChange} className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id
          const isCorrect = option.isCorrect

          let optionClassName = "border border-gray-300 dark:border-gray-600 p-4 rounded-md transition-all"

          if (showCorrectAnswer) {
            if (isCorrect) {
              optionClassName = cn(
                optionClassName,
                "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700",
              )
            } else if (isSelected && !isCorrect) {
              optionClassName = cn(optionClassName, "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700")
            }
          } else if (isSelected) {
            optionClassName = cn(optionClassName, "bg-primary/10 border-primary")
          }

          return (
            <div key={option.id} className={optionClassName}>
              <div className="flex items-start">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <Label htmlFor={option.id} className="ml-3 text-base font-normal cursor-pointer">
                  {option.text}
                </Label>
              </div>
            </div>
          )
        })}
      </RadioGroup>

      {showCorrectAnswer && explanation && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Explanation</h4>
          <p className="text-sm text-blue-700 dark:text-blue-200">{explanation}</p>
        </div>
      )}
    </div>
  )
}

