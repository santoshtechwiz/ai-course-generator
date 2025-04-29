"use client"

import type React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/tailwindUtils"

interface CodeQuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled?: boolean
  renderOptionContent: (option: string) => React.ReactNode
}

export default function CodeQuizOptions({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  renderOptionContent,
}: CodeQuizOptionsProps) {
  return (
    <div className="space-y-3 mt-4">
      {options.map((option, index) => (
        <motion.div
          key={index}
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
                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                selectedOption === option ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/80",
              )}
              onClick={() => !disabled && onSelect(option)}
            >
              {renderOptionContent(option)}
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
