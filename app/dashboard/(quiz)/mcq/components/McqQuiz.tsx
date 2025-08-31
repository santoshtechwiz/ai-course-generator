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
  const options = useMemo(() => {
    return (question?.options || []).map((option, index) => ({
      id: `${option}-${index}`,
      text: option,
      letter: String.fromCharCode(65 + index),
    }))
  }, [question?.options])

  // Find the option ID that matches the existing answer text
  const existingOptionId = useMemo(() => {
    if (!existingAnswer) return null
    const matchingOption = options.find((option) => option.text === existingAnswer)
    return matchingOption?.id || null
  }, [existingAnswer, options])

  const [selectedOption, setSelectedOption] = useState<string | null>(existingOptionId)
  const [isAnswering, setIsAnswering] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

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
            className="w-full space-y-6"
          >
            {/* Enhanced Question Header */}
            <motion.div
              className="text-center space-y-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Question Number Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-primary">
                  Question {questionNumber}
                </span>
              </div>

              {/* Enhanced Question Text */}
              <motion.h2
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-relaxed max-w-4xl mx-auto px-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {questionText}
              </motion.h2>

              {/* Question Type Indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>Select the best answer from the options below</span>
              </div>
            </motion.div>

            {/* Enhanced Options Section */}
            <div className="w-full max-w-3xl mx-auto">
              <div className="space-y-4">
                {options.length === 0 ? (
                  <motion.div
                    className="text-center py-12 px-6 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Options Available</h3>
                    <p className="text-sm text-muted-foreground">This question doesn't have any answer options yet.</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {options.map((option, index) => {
                      const isSelected = selectedOption === option.id
                      const isHovered = hoveredOption === option.id
                      const isDisabled = isAnswering || isSubmitting || stateManager.isSubmitting

                      return (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                          whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
                          whileTap={!isDisabled ? { scale: 0.98 } : {}}
                          onHoverStart={() => !isDisabled && setHoveredOption(option.id)}
                          onHoverEnd={() => setHoveredOption(null)}
                          className="group"
                        >
                          <label
                            htmlFor={`option-${option.id}`}
                            className={cn(
                              "flex items-center gap-4 p-5 sm:p-6 w-full rounded-2xl border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg",
                              "bg-card/80 backdrop-blur-sm",
                              isSelected
                                ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
                                : isHovered
                                  ? "border-primary/40 bg-primary/5 shadow-md"
                                  : "border-border/60 hover:border-primary/30 hover:bg-accent/30",
                              isDisabled && "opacity-60 cursor-not-allowed",
                            )}
                            onClick={() => !isDisabled && handleOptionSelect(option.id)}
                          >
                            {/* Enhanced Radio Input */}
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
                            <motion.div
                              className={cn(
                                "flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg flex-shrink-0 transition-all duration-300",
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                  : isHovered
                                    ? "bg-primary/20 text-primary border-2 border-primary/40"
                                    : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground"
                              )}
                              whileHover={!isDisabled ? { scale: 1.1 } : {}}
                              whileTap={!isDisabled ? { scale: 0.95 } : {}}
                            >
                              {option.letter}
                            </motion.div>

                            {/* Enhanced Option Text */}
                            <div className="flex-1 text-base sm:text-lg font-medium leading-relaxed min-w-0 text-foreground group-hover:text-primary transition-colors duration-200">
                              {option.text}
                            </div>

                            {/* Enhanced Selection Indicator */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className="flex-shrink-0"
                              >
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                                  <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                                </div>
                              </motion.div>
                            )}
                          </label>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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
          </motion.div>
        </QuizContainer>
      )}
    </QuizStateProvider>
  )
}

export default McqQuiz
