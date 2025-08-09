"use client"

import { useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { cn } from "@/lib/utils"
import { CheckCircle2, Sparkles, Zap, Target } from 'lucide-react'
import { toast } from "sonner"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: string[]
  }
  onAnswer: (answer: string) => void
  onNext?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
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
  const [isAnswering, setIsAnswering] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const options = useMemo(() => {
    return (question?.options || []).map((option, index) => ({
      id: `${option}-${index}`,
      text: option,
      letter: String.fromCharCode(65 + index),
    }))
  }, [question?.options])

  const handleOptionSelect = useCallback(
    async (optionId: string) => {
      if (isAnswering || isSubmitting) return

      setIsAnswering(true)

      try {
        // Add haptic feedback for mobile devices
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        await new Promise((resolve) => setTimeout(resolve, 150))
        setSelectedOption(optionId)

        const selected = options.find((o) => o.id === optionId)
        if (selected) {
          onAnswer(selected.text)
          // Show success feedback
          toast.success("Answer selected!", {
            duration: 1000,
            position: "top-center",
          })
        }
      } catch (error) {
        toast.error("Failed to select answer")
      } finally {
        setIsAnswering(false)
      }
    },
    [onAnswer, isAnswering, isSubmitting, options],
  )

  const questionText = question.text || question.question || "Question not available"

  return (
    <QuizStateProvider
      onError={(error) => toast.error(error)}
      onSuccess={(message) => toast.success(message || "Great job!")}
      globalLoading={isLastQuestion}
    >
      {(stateManager) => (
        <QuizContainer
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          quizType="mcq"
          animationKey={`mcq-${question.id}`}
          difficulty={difficulty?.toLowerCase() as "easy" | "medium" | "hard"}
          fullWidth={true}
        >
          <div className="space-y-6 sm:space-y-8">
            {/* Enhanced Question Header */}
            <motion.div
              className="text-center space-y-4 sm:space-y-6 mb-6 sm:mb-8 px-2 sm:px-4"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Question Type Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800 rounded-full">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Multiple Choice</span>
                </div>
              </motion.div>

              {/* Question Text with enhanced styling */}
              <motion.h2
                className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground leading-relaxed break-words"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {questionText}
              </motion.h2>

              {/* Animated underline */}
              <motion.div
                className="h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full mx-auto max-w-48"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />

              {/* Progress indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xs sm:text-sm text-muted-foreground"
              >
                Question {questionNumber} of {totalQuestions}
              </motion.div>
            </motion.div>

            {/* Enhanced Options with better mobile experience */}
            <div className="mx-2 sm:mx-4 space-y-3 sm:space-y-4">
              <AnimatePresence>
                {options.map((option, index) => {
                  const isSelected = selectedOption === option.id
                  const isHovered = hoveredOption === option.id
                  const isDisabled = isAnswering || isSubmitting || stateManager.isSubmitting

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.05 + 0.1, 
                        duration: 0.3
                      }}
                      whileHover={!isDisabled ? { 
                        scale: 1.01,
                        transition: { duration: 0.1 }
                      } : {}}
                      whileTap={!isDisabled ? { scale: 0.99 } : {}}
                      onHoverStart={() => !isDisabled && setHoveredOption(option.id)}
                      onHoverEnd={() => setHoveredOption(null)}
                    >
                      <motion.label
                        htmlFor={`option-${option.id}`}
                        className={cn(
                          "group relative flex items-center space-x-3 p-3 sm:p-4 overflow-hidden rounded-lg sm:rounded-xl border cursor-pointer transition-all duration-200",
                          "hover:shadow-lg hover:shadow-primary/5",
                          "focus-within:ring-1 focus-within:ring-primary/50",
                          isSelected
                            ? "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-md shadow-primary/10"
                            : isHovered
                            ? "border-primary/50 bg-gradient-to-r from-primary/5 to-primary/2 shadow-sm"
                            : "border-border/50 bg-card/80 hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2",
                          isDisabled && "opacity-60 cursor-not-allowed",
                        )}
                        onClick={() => !isDisabled && handleOptionSelect(option.id)}
                      >
                        {/* Radio Input */}
                        <input
                          type="radio"
                          name="mcq-option"
                          id={`option-${option.id}`}
                          value={option.id}
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => !isDisabled && handleOptionSelect(option.id)}
                          className="sr-only"
                        />

                        {/* Enhanced Letter Badge */}
                        <div
                          className={cn(
                            "relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-semibold text-sm flex-shrink-0 transition-all duration-200",
                            isSelected
                              ? "bg-primary text-primary-foreground scale-105"
                              : isHovered
                              ? "bg-primary/20 text-primary scale-102"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
                          )}
                        >
                          {option.letter}
                          
                          {/* Success indicator for selected option */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                className="absolute -top-0.5 -right-0.5"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <CheckCircle2 className="w-3 h-3 text-green-500 bg-white rounded-full" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Enhanced Option Text */}
                        <div
                          className={cn(
                            "flex-1 text-sm sm:text-base font-medium leading-snug min-w-0 relative z-10",
                            "break-words whitespace-normal",
                            isSelected
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          <motion.span
                            className="block"
                          >
                            {option.text}
                          </motion.span>
                        </div>
                      </motion.label>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Enhanced Footer with better mobile layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <QuizFooter
                onNext={onNext ? () => stateManager.handleNext(onNext) : undefined}
                onPrevious={undefined}
                onSubmit={isLastQuestion && onSubmit ? () => stateManager.handleSubmit(onSubmit) : undefined}
                onRetake={onRetake}
                canGoNext={!!selectedOption && !isAnswering}
                canGoPrevious={false}
                isLastQuestion={isLastQuestion}
                isSubmitting={isSubmitting || stateManager.isSubmitting}
                showRetake={showRetake}
                hasAnswer={!!selectedOption}
                submitState={stateManager.submitState}
                nextState={stateManager.nextState}
              />
            </motion.div>

            {/* Progress indicator at bottom for mobile */}
            <motion.div
              className="block sm:hidden text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{questionNumber} of {totalQuestions}</span>
              </div>
            </motion.div>
          </div>
        </QuizContainer>
      )}
    </QuizStateProvider>
  )
}

export default McqQuiz
