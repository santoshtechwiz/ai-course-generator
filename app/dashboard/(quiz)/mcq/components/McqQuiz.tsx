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
            {/* Question Header - Simplified */}
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
            

              {/* Question Text */}
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed max-w-3xl mx-auto">
                {questionText}
              </h2>
            </motion.div>

            {/* Options - Simplified Layout */}
            <div className="w-full space-y-3 max-w-2xl mx-auto">
              {options.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No options available for this question.</p>
                </div>
              ) : (
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
                            "flex items-center gap-3 p-3 sm:p-4 w-full rounded-xl border cursor-pointer transition-colors duration-200 shadow-sm",
                            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                            "bg-card hover:bg-muted",
                            isSelected
                              ? "border-primary/50"
                              : isHovered
                                ? "border-primary/30"
                                : "border-border",
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
                             "flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm flex-shrink-0",
                             isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                           )}
                         >
                           {option.letter}
                         </div>
 
                         {/* Option Text */}
                         <div className="flex-1 text-sm sm:text-base font-medium leading-relaxed min-w-0 text-foreground">
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
              )}
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
