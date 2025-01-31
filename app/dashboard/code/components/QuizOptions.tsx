import type React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface QuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled: boolean
  correctAnswer?: string
}

const QuizOptions: React.FC<QuizOptionsProps> = ({ options, selectedOption, onSelect, disabled, correctAnswer }) => {
  return (
    <div className="space-y-2 mt-4">
      {options.map((option, index) => (
        <motion.button
          key={index}
          className={cn(
            "w-full text-left px-4 py-2 border rounded-lg transition",
            selectedOption === option && !disabled ? "bg-blue-100 border-blue-500" : "bg-white",
            disabled && selectedOption === option && selectedOption !== correctAnswer && "bg-red-100 border-red-500",
            disabled && option === correctAnswer && "bg-green-100 border-green-500",
          )}
          onClick={() => onSelect(option)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
          {option}
        </motion.button>
      ))}
    </div>
  )
}

export default QuizOptions

