"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

interface McqQuizProps {
  
  question: {
    id: string
    text?: string
    question?: string
    options: string[]
  }
  onAnswer: (answer: string) => void
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  canGoNext?: boolean
  isLastQuestion?: boolean
  showRetake?: boolean
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
}

const McqQuiz = ({
  question,
  onAnswer,
  onNext,
  onSubmit,
  onRetake,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  canGoNext = false,
  isLastQuestion = false,
  showRetake = false,
  quizTitle = "Multiple Choice Quiz",
  quizSubtitle = "Choose the best answer for each question",
  difficulty = "Medium",
  category = "General Knowledge",
  timeLimit,
}: McqQuizProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)

  // Calculate progress percentage
  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)

  // Ensure options are properly formatted dynamically
  const options = useMemo(() => {
    return (question?.options || []).map((option, index) => ({
      id: option,
      text: option,
      letter: String.fromCharCode(65 + index), // A, B, C, D...
    }))
  }, [question?.options])

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    onAnswer(optionId)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  const questionText = question.text || question.question || "Question not available"

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      
      progressPercentage={progressPercentage}
      quizType="Multiple Choice"
      animationKey={question.id}
      quizTitle={quizTitle}
      quizSubtitle={quizSubtitle}
      difficulty={difficulty}
      category={category}
      timeLimit={timeLimit}
    >
      <div className="space-y-6">
        {/* Question Header */}
        <motion.div
          className="text-center space-y-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2
            className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-relaxed max-w-4xl mx-auto px-4 break-words"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {questionText}
          </motion.h2>

          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full mx-auto max-w-32"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* Options Container */}
        <div className="max-w-3xl mx-auto">
          <RadioGroup value={selectedOption || ""} onValueChange={handleOptionSelect} className="space-y-3">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
              {options.map((option, index) => {
                const isSelected = selectedOption === option.id

                return (
                  <motion.div
                    key={option.id}
                    variants={optionVariants}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      className={cn(
                        "group relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer",
                        "hover:shadow-lg hover:shadow-primary/10",
                        isSelected
                          ? "border-primary bg-gradient-to-r from-primary/15 via-primary/8 to-primary/5 shadow-lg shadow-primary/20"
                          : "border-border/60 bg-gradient-to-r from-card/90 to-card/70 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4",
                      )}
                      onClick={() => handleOptionSelect(option.id)}
                      layout
                    >
                      {/* Selection Background Glow */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/12 to-primary/6"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </AnimatePresence>

                      <div className="relative flex items-start space-x-3 p-3 sm:p-4">
                        {/* Option Letter Badge */}
                        <motion.div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm transition-all duration-300 flex-shrink-0",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {option.letter}
                        </motion.div>

                        {/* Radio Button (Hidden but functional) */}
                        <RadioGroupItem
                          value={option.id}
                          id={`option-${option.id}`}
                          disabled={isSubmitting}
                          className="sr-only"
                        />

                        {/* Option Text with proper wrapping */}
                        <Label
                          htmlFor={`option-${option.id}`}
                          className={cn(
                            "flex-1 cursor-pointer text-sm sm:text-base font-medium leading-relaxed transition-all duration-300 min-w-0",
                            "break-words whitespace-normal",
                            isSelected
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground group-hover:text-foreground",
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
                            animate={isSelected ? { x: 4 } : { x: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="block"
                          >
                            {option.text}
                          </motion.span>
                        </Label>

                        {/* Selection Indicator */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground flex-shrink-0"
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
                              <CheckCircle2 className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Hover Shimmer Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 1.8,
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
        </div>

        {/* Footer */}
        <QuizFooter
          onNext={onNext}
          onPrevious={undefined}
          onSubmit={isLastQuestion ? onSubmit : undefined}
          onRetake={onRetake}
          canGoNext={!!selectedOption && canGoNext}
          canGoPrevious={false}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          showRetake={showRetake}
          hasAnswer={!!selectedOption}
        />
      </div>
    </QuizContainer>
  )
}

export default McqQuiz
