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
                    "hover:shadow-lg hover:shadow-orange-100/50 dark:hover:shadow-orange-900/20",
                    isSelected
                      ? "border-orange-400 dark:border-orange-600 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950/50 dark:via-amber-900/30 dark:to-orange-900/40 shadow-lg shadow-orange-200/50 dark:shadow-orange-800/30"
                      : "border-orange-200 dark:border-orange-800 bg-gradient-to-r from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/20 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 dark:hover:from-orange-950/30 dark:hover:to-amber-900/20",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => !disabled && onSelect(option)}
                  layout
                >
                  {/* Selection Background Glow - Orange theme */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-orange-100/80 to-amber-100/60 dark:from-orange-950/60 dark:to-amber-900/40"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative flex items-start space-x-3 p-3 sm:p-4">
                    {/* Option Letter Badge - Orange theme */}
                    <motion.div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-all duration-300 flex-shrink-0 shadow-md",
                        isSelected
                          ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/30"
                          : "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-800/50 text-orange-700 dark:text-orange-300 group-hover:from-orange-200 group-hover:to-amber-200 dark:group-hover:from-orange-800/70 dark:group-hover:to-amber-700/70",
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
                          ? "text-orange-800 dark:text-orange-200 font-bold"
                          : "text-gray-700 dark:text-gray-300 group-hover:text-orange-700 dark:group-hover:text-orange-300",
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

                    {/* Selection Indicator - Orange theme */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white flex-shrink-0 shadow-lg shadow-orange-500/30"
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
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
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
