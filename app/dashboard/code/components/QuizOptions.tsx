import type React from "react"
import { Button } from "@/components/ui/button"

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
    <div className="space-y-3">
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          className={`w-full p-4 h-auto flex items-start justify-start text-left whitespace-normal ${
            selectedOption === option ? "border-2 border-primary bg-primary/5" : "hover:bg-secondary/80"
          }`}
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          <div className="flex items-center">
            <div className="pl-2 w-full">{renderOptionContent(option)}</div>
          </div>
        </Button>
      ))}
    </div>
  )
}

export default QuizOptions

