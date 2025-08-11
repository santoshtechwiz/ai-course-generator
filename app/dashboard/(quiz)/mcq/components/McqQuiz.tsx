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
            className="w-full space-y-6"
          >
            {/* Question Header - Simplified */}
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Quiz Type Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Multiple Choice</span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed max-w-3xl mx-auto">
                {questionText}
              </h2>
            </motion.div>

            {/* Options - Simplified Layout */}
            <div className="w-full space-y-3 max-w-2xl mx-auto">
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
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={!isDisabled ? { scale: 1.01 } : {}}
                      whileTap={!isDisabled ? { scale: 0.99 } : {}}
                      onHoverStart={() => !isDisabled && setHoveredOption(option.id)}
                      onHoverEnd={() => setHoveredOption(null)}
                    >
                      <label
                        htmlFor={`option-${option.id}`}
                        className={cn(
                          "flex items-center gap-4 p-4 w-full rounded-xl border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg",
                          "focus-within:ring-2 focus-within:ring-blue-300 dark:focus-within:ring-blue-600",
                          "bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
                          isSelected
                            ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/30 shadow-blue-200/50 dark:shadow-blue-800/30"
                            : isHovered
                              ? "border-blue-300 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-md"
                              : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600",
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
                            "flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm flex-shrink-0 transition-all duration-300 shadow-md",
                            isSelected
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30"
                              : "bg-gradient-to-r from-slate-100 to-gray-200 dark:from-slate-700 dark:to-gray-600 text-slate-700 dark:text-slate-200",
                          )}
                        >
                          {option.letter}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1 text-sm sm:text-base font-medium leading-relaxed min-w-0">
                          {option.text}
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0"
                          >
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                      </label>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
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
