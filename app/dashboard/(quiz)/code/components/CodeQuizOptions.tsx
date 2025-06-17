"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle2, Code } from "lucide-react"

interface CodeQuizOptionsProps {
  options: string[]
  selectedOption: string | null
  onSelect: (option: string) => void
  disabled?: boolean
}

const CodeQuizOptions = ({ options, selectedOption, onSelect, disabled = false }: CodeQuizOptionsProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const optionVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
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

  if (!options || options.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No options available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm font-medium text-muted-foreground">Choose the correct answer:</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4">
        {options.map((option, index) => {
          const isSelected = selectedOption === option
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D...

          return (
            <motion.div
              key={option}
              variants={optionVariants}
              whileHover={!disabled ? { scale: 1.02, x: 4 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              <Button
                variant="ghost"
                onClick={() => !disabled && onSelect(option)}
                disabled={disabled}
                className={cn(
                  "group relative w-full h-auto p-0 overflow-hidden rounded-2xl border-2 transition-all duration-300",
                  "hover:shadow-lg hover:shadow-primary/10",
                  isSelected
                    ? "border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20"
                    : "border-border/50 bg-gradient-to-r from-card/80 to-card/40 hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                {/* Selection Background Glow */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>

                <div className="relative flex items-center space-x-6 p-6 w-full text-left">
                  {/* Option Letter Badge */}
                  <motion.div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                    )}
                    whileHover={!disabled ? { scale: 1.05 } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                  >
                    {optionLetter}
                  </motion.div>

                  {/* Option Text */}
                  <div className="flex-1 min-w-0">
                    <motion.p
                      className={cn(
                        "text-lg font-medium leading-relaxed transition-all duration-300 break-words",
                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                      )}
                      initial={false}
                      animate={isSelected ? { x: 4 } : { x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      {option}
                    </motion.p>
                  </div>

                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground"
                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                          duration: 0.4,
                        }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
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
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "linear",
                  }}
                  style={{
                    transform: "translateX(-100%)",
                  }}
                />
              </Button>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default CodeQuizOptions
