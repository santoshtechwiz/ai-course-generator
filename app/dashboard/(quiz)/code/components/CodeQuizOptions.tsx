"use client"

import { motion, AnimatePresence } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, Code } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeQuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled?: boolean
  correctAnswer?: string
  showCorrectAnswer?: boolean
}

const CodeQuizOptions = ({ options, selectedOption, onSelect, disabled = false }: CodeQuizOptionsProps) => {
  if (!Array.isArray(options) || options.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No options available</p>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const optionVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  }

  return (
    <ScrollArea className="max-h-[60vh] pr-2">
      <RadioGroup value={selectedOption || ""} onValueChange={onSelect} disabled={disabled}>
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedOption === option
            const optionLetter = String.fromCharCode(65 + index) // A, B, C, D...

            return (
              <motion.div
                key={option}
                variants={optionVariants}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className={cn(
                    "group relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer",
                    "hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/20",
                    isSelected
                      ? "border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-primary/20 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 shadow-lg shadow-primary/10 dark:shadow-primary/20"
                      : "border-border bg-gradient-to-r from-background to-muted/30 dark:from-background dark:to-muted/20 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/5 hover:to-muted/10 dark:hover:from-primary/10 dark:hover:to-muted/10",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => !disabled && onSelect(option)}
                  layout
                >
                  {/* Selection Background Glow - Theme */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-muted/20 dark:from-primary/30 dark:to-muted/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative flex items-start space-x-3 p-3 sm:p-4">
                    {/* Option Letter Badge - Theme */}
                    <motion.div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-all duration-300 flex-shrink-0 shadow-md",
                        isSelected
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/20"
                          : "bg-gradient-to-r from-muted to-muted/80 dark:from-muted/50 dark:to-muted/50 text-primary group-hover:from-primary/10 group-hover:to-muted/20 dark:group-hover:from-primary/20 dark:group-hover:to-muted/20",
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {optionLetter}
                    </motion.div>

                    {/* Hidden Radio Button */}
                    <RadioGroupItem
                      value={option}
                      id={`code-option-${index}`}
                      disabled={disabled}
                      className="sr-only"
                    />

                    {/* Option Text - Enhanced readability */}
                    <Label
                      htmlFor={`code-option-${index}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm font-semibold leading-relaxed transition-all duration-300 min-w-0",
                        "break-words whitespace-normal",
                        isSelected
                          ? "text-primary font-bold"
                          : "text-foreground group-hover:text-primary dark:group-hover:text-primary",
                        disabled && "cursor-not-allowed",
                      )}
                      style={{
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                        hyphens: "auto",
                      }}
                    >
                      <motion.span
                        initial={false}
                        animate={isSelected ? { x: 3 } : { x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="block"
                      >
                        {option}
                      </motion.span>
                    </Label>

                    {/* Selection Indicator - Theme */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex-shrink-0 shadow-lg shadow-primary/20"
                          initial={{ scale: 0, opacity: 0, rotate: -90 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0, rotate: 90 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            duration: 0.3,
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hover Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "linear",
                    }}
                    style={{
                      transform: "translateX(-100%)",
                    }}
                  />
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </RadioGroup>
    </ScrollArea>
  )
}

export default CodeQuizOptions
