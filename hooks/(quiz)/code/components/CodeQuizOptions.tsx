"use client"

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeQuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled?: boolean
  renderOptionContent: (option: string) => React.ReactNode
}

const CodeQuizOptions: React.FC<CodeQuizOptionsProps> = ({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  renderOptionContent,
}) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const handleOptionClick = useCallback(
    (option: string) => {
      if (!disabled) {
        onSelect(option)
      }
    },
    [disabled, onSelect],
  )

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Quiz options">
      {options.map((option, index) => {
        const isSelected = selectedOption === option
        const isHovered = hoveredOption === option

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              disabled && "opacity-70 cursor-not-allowed",
            )}
            onClick={() => handleOptionClick(option)}
            onMouseEnter={() => setHoveredOption(option)}
            onMouseLeave={() => setHoveredOption(null)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault()
                onSelect(option)
              }
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground",
                    isHovered && !isSelected && "border-primary/70",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">{renderOptionContent(option)}</div>
            </div>

            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-2 right-2"
                >
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

export default React.memo(CodeQuizOptions)
