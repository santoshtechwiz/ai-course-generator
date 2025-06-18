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
                    "hover:shadow-md hover:shadow-primary/8",
                    isSelected
                      ? "border-primary bg-gradient-to-r from-primary/12 via-primary/6 to-primary/4 shadow-md shadow-primary/15"
                      : "border-border/60 bg-gradient-to-r from-card/90 to-card/70 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/6 hover:to-primary/3",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => !disabled && onSelect(option)}
                  layout
                >
                  {/* Selection Background Glow */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/8 to-primary/4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative flex items-start space-x-3 p-3 sm:p-4">
                    {/* Option Letter Badge */}
                    <motion.div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm transition-all duration-300 flex-shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
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

                    {/* Option Text - Compact and Readable */}
                    <Label
                      htmlFor={`code-option-${index}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm font-medium leading-relaxed transition-all duration-300 min-w-0",
                        "break-words whitespace-normal",
                        isSelected
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground group-hover:text-foreground",
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

                    {/* Selection Indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground flex-shrink-0"
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
