"use client"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/tailwindUtils"

interface CodeQuizOptionsProps {
  options: string[];
  selectedOption?: string;
  onSelect: (option: string) => void;
  disabled?: boolean;
  renderOptionContent?: (option: string) => React.ReactNode;
}

export default function CodeQuizOptions({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  renderOptionContent,
}: CodeQuizOptionsProps) {
  return (
    <RadioGroup value={selectedOption || ""} onValueChange={onSelect} className="space-y-3 w-full" disabled={disabled}>
      {options.map((option, index) => (
        <motion.div
          key={`option-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.1,
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <div
              className={cn(
                "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                "border-2",
                selectedOption === option ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/80",
              )}
              onClick={() => !disabled && onSelect(option)}
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer font-medium text-sm sm:text-base">
                {renderOptionContent ? renderOptionContent(option) : option}
              </Label>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </RadioGroup>
  )
}
