"use client"
import { motion } from "framer-motion"
import type React from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/tailwindUtils"

interface CodeQuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled?: boolean
  renderOptionContent?: (option: string) => React.ReactNode
}

export default function CodeQuizOptions({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  renderOptionContent,
}: CodeQuizOptionsProps) {
  // Create a safe copy of options to avoid errors
  const safeOptions = Array.isArray(options) ? options : []

  return (
    <RadioGroup
      value={selectedOption || ""}
      onValueChange={(option) => {
        if (safeOptions.includes(option)) {
          onSelect(option)
        }
      }}
      className="space-y-4 w-full"
      disabled={disabled}
    >
      {safeOptions.map((option, index) => (
        <motion.div
          key={`option-${index}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.1,
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          whileHover={{
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2, ease: "easeOut" },
          }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className={cn(
              "flex items-center space-x-4 p-6 rounded-2xl transition-all duration-300 w-full cursor-pointer group relative overflow-hidden",
              "border-2 shadow-lg hover:shadow-xl",
              selectedOption === option
                ? "border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 ring-2 ring-primary/20 shadow-primary/20"
                : "border-muted hover:border-primary/40 bg-gradient-to-r from-background to-muted/20 hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/10",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => {
              if (!disabled && safeOptions.includes(option)) {
                onSelect(option)
              }
            }}
            whileHover={
              !disabled
                ? {
                    boxShadow:
                      selectedOption === option
                        ? "0 20px 25px -5px rgba(var(--primary), 0.1), 0 10px 10px -5px rgba(var(--primary), 0.04)"
                        : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }
                : {}
            }
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />

            {/* Subtle shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
              initial={false}
            />

            <motion.div
              animate={selectedOption === option ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <RadioGroupItem
                value={option}
                id={`option-${index}`}
                className={cn(
                  "transition-all duration-300 relative z-10",
                  selectedOption === option
                    ? "text-primary border-primary shadow-md ring-2 ring-primary/30"
                    : "group-hover:border-primary/60 group-hover:text-primary/80 group-hover:shadow-sm",
                )}
              />
            </motion.div>

            <Label
              htmlFor={`option-${index}`}
              className={cn(
                "flex-grow cursor-pointer font-medium text-base leading-relaxed transition-all duration-300 relative z-10",
                selectedOption === option
                  ? "text-primary font-semibold"
                  : "text-foreground group-hover:text-primary/90",
                disabled && "cursor-not-allowed",
              )}
            >
              <motion.span
                animate={selectedOption === option ? { x: 4 } : { x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {renderOptionContent ? renderOptionContent(option) : option}
              </motion.span>
            </Label>

            {/* Selection indicator with glow */}
            {selectedOption === option && (
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.2, 1],
                  opacity: 1,
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary), 0)",
                    "0 0 0 8px rgba(var(--primary), 0.1)",
                    "0 0 0 4px rgba(var(--primary), 0.2)",
                  ],
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  times: [0, 0.6, 1],
                }}
              />
            )}
          </motion.div>
        </motion.div>
      ))}
    </RadioGroup>
  )
}
