"use client"

import { useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { cn } from "@/lib/utils"
import { CheckCircle2, Target } from "lucide-react"
import { toast } from "sonner"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"

// Standardized animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
}

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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="w-full space-y-8">
              {/* Question Header */}
              <motion.div
                className="w-full text-center space-y-6"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                {/* Quiz Type Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-6"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Multiple Choice</span>
                  </div>
                </motion.div>

                {/* Question Text */}
                <motion.h2
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-relaxed break-words max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {questionText}
                </motion.h2>

                {/* Progress indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-muted-foreground"
                >
                  Question {questionNumber} of {totalQuestions}
                </motion.div>
              </motion.div>

              {/* Options */}
              <div className="w-full space-y-4 max-w-4xl mx-auto">
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
                          delay: index * 0.1 + 0.1,
                          duration: 0.4,
                          type: "spring",
                          stiffness: 200,
                        }}
                        whileHover={
                          !isDisabled
                            ? {
                                scale: 1.02,
                                transition: { duration: 0.2 },
                              }
                            : {}
                        }
                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                        onHoverStart={() => !isDisabled && setHoveredOption(option.id)}
                        onHoverEnd={() => setHoveredOption(null)}
                        className="w-full"
                      >
                        <motion.label
                          htmlFor={`option-${option.id}`}
                          className={cn(
                            "group relative flex items-center gap-4 p-4 sm:p-5 w-full rounded-xl border-2 cursor-pointer transition-all duration-300",
                            "hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/50",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                              : isHovered
                                ? "border-primary/50 bg-primary/5 shadow-md"
                                : "border-border hover:border-primary/30 hover:bg-primary/5",
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

                          {/* Letter Badge */}
                          <div
                            className={cn(
                              "relative flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm flex-shrink-0 transition-all duration-300",
                              isSelected
                                ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                                : isHovered
                                  ? "bg-primary/20 text-primary scale-105"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary",
                            )}
                          >
                            {option.letter}

                            {/* Success indicator */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  className="absolute -top-1 -right-1"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-500 bg-background rounded-full" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Option Text */}
                          <div
                            className={cn(
                              "flex-1 text-sm sm:text-base font-medium leading-relaxed min-w-0",
                              "break-words whitespace-normal",
                              isSelected
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            <motion.span
                              className="block"
                              animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {option.text}
                            </motion.span>
                          </div>

                          {/* Selection indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="flex-shrink-0"
                            >
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            </motion.div>
                          )}
                        </motion.label>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full max-w-4xl mx-auto"
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
            </div>
          </motion.div>
        </QuizContainer>
      )}
    </QuizStateProvider>
  )
}

export default McqQuiz
