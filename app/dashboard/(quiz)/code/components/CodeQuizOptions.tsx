"use client"

import type React from "react"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface QuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled: boolean
  renderOptionContent: (option: string) => React.ReactNode
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
  options,
  selectedOption,
  onSelect,
  disabled,
  renderOptionContent,
}) => {
  return (
    <RadioGroup onValueChange={(value) => onSelect(value)} value={selectedOption || ""} className="space-y-3">
      {options.map((option, index) => (
        <motion.div
          key={`${index}-${option}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div
            className={cn(
              "flex w-full items-start space-x-2 p-3 sm:p-4 rounded-lg transition-all",
              "hover:bg-muted/50",
              "border border-muted",
              selectedOption === option && "border-primary bg-primary/5",
            )}
          >
            <RadioGroupItem value={option} id={`option-${index}`} disabled={disabled} className="mt-1" />
            <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer font-medium text-sm sm:text-base">
              {renderOptionContent(option)}
            </Label>
          </div>
        </motion.div>
      ))}
    </RadioGroup>
  )
}

export default QuizOptions

