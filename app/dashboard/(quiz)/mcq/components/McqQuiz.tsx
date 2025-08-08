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
          <div className="space-y-8 md:space-y-12">
            {/* Enhanced Question Header */}
            <motion.div
              className="text-center space-y-6 mb-8"
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800 rounded-full">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Multiple Choice</span>
                </div>
              </motion.div>

              {/* Question Text with enhanced styling */}
              <motion.h2
                className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-relaxed max-w-5xl mx-auto px-4 break-words"
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
                className="text-sm text-muted-foreground"
              >
                Question {questionNumber} of {totalQuestions}
              </motion.div>
            </motion.div>

            {/* Enhanced Options with better mobile experience */}
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              <AnimatePresence>
                {options.map((option, index) => {
                  const isSelected = selectedOption === option.id
                  const isHovered = hoveredOption === option.id
                  const isDisabled = isAnswering || isSubmitting || stateManager.isSubmitting

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1 + 0.2, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                      whileHover={!isDisabled ? { 
                        scale: 1.02, 
                        y: -2,
                        transition: { duration: 0.2 }
                      } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      onHoverStart={() => !isDisabled && setHoveredOption(option.id)}
                      onHoverEnd={() => setHoveredOption(null)}
                    >
                      <motion.label
                        htmlFor={`option-${option.id}`}
                        className={cn(
                          "group relative flex items-start space-x-4 md:space-x-6 p-4 sm:p-6 md:p-8 overflow-hidden rounded-2xl border-2 cursor-pointer transition-all duration-300",
                          "hover:shadow-xl hover:shadow-primary/10",
                          "focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2",
                          isSelected
                            ? "border-primary bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 shadow-xl shadow-primary/20"
                            : isHovered
                            ? "border-primary/60 bg-gradient-to-r from-primary/8 to-primary/4 shadow-lg"
                            : "border-border/60 bg-gradient-to-r from-card/90 to-card/70 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4",
                          isDisabled && "opacity-60 cursor-not-allowed",
                        )}
                        onClick={() => !isDisabled && handleOptionSelect(option.id)}
                      >
                        {/* Animated background effect */}
                        <AnimatePresence>
                          {(isSelected || isHovered) && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/4 to-primary/8"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                        </AnimatePresence>

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
                            "relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl font-bold text-base md:text-lg flex-shrink-0 transition-all duration-300 shadow-md",
                            isSelected
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110"
                              : isHovered
                              ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary scale-105"
                              : "bg-gradient-to-br from-muted/80 to-muted/60 text-muted-foreground group-hover:bg-gradient-to-br group-hover:from-primary/20 group-hover:to-primary/10 group-hover:text-primary",
                          )}
                        >
                          {option.letter}
                          
                          {/* Sparkle effect for selected option */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                className="absolute -top-1 -right-1"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Enhanced Option Text */}
                        <div
                          className={cn(
                            "flex-1 text-base sm:text-lg md:text-xl font-medium leading-relaxed min-w-0 relative z-10",
                            "break-words whitespace-normal",
                            isSelected
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          <motion.span
                            initial={false}
                            animate={isSelected ? { x: 8 } : { x: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="block"
                          >
                            {option.text}
                          </motion.span>
                        </div>

                        {/* Enhanced Check Icon with animation */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex-shrink-0 shadow-lg"
                              initial={{ scale: 0, opacity: 0, rotate: -180 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              exit={{ scale: 0, opacity: 0, rotate: 180 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Hover effect indicator */}
                        <AnimatePresence>
                          {isHovered && !isSelected && (
                            <motion.div
                              className="absolute right-4 top-1/2 transform -translate-y-1/2"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-primary" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
