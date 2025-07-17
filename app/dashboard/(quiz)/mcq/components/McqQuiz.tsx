"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

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
  onSkip?: () => void | Promise<void>
  onExit?: () => void | Promise<void>
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
  error?: string | null
  onRetry?: () => void
  allowSkip?: boolean
  skippedQuestions?: number
  autoSave?: boolean
  lastSaved?: Date
  enableKeyboardShortcuts?: boolean
}

const McqQuiz = ({
  question,
  onAnswer,
  onNext,
  onSubmit,
  onRetake,
  onSkip,
  onExit,
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
  error,
  onRetry,
  allowSkip = false,
  skippedQuestions = 0,
  autoSave = false,
  lastSaved,
  enableKeyboardShortcuts = true,
}: McqQuizProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)
  const [isAnswering, setIsAnswering] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const options = useMemo(() => {
    // Ensure unique keys by using both index and option text
    return (question?.options || []).map((option, index) => ({
      id: `${option}-${index}`,
      text: option,
      letter: String.fromCharCode(65 + index),
    }))
  }, [question?.options])

  // Keyboard navigation for options
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Number keys (1-4) for quick selection
      const numberKey = parseInt(event.key)
      if (numberKey >= 1 && numberKey <= options.length && !isAnswering) {
        event.preventDefault()
        const optionIndex = numberKey - 1
        handleOptionSelect(options[optionIndex].id)
      }

      // Letter keys (A-D) for selection
      const letterKey = event.key.toUpperCase()
      const letterIndex = letterKey.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
      if (letterIndex >= 0 && letterIndex < options.length && !isAnswering) {
        event.preventDefault()
        handleOptionSelect(options[letterIndex].id)
      }

      // Arrow key navigation
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setFocusedIndex(prev => (prev + 1) % options.length)
      }
      
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setFocusedIndex(prev => prev <= 0 ? options.length - 1 : prev - 1)
      }

      // Enter to select focused option
      if (event.key === 'Enter' && focusedIndex >= 0 && focusedIndex < options.length) {
        event.preventDefault()
        handleOptionSelect(options[focusedIndex].id)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, options, isAnswering, focusedIndex])

  const handleOptionSelect = useCallback(async (optionId: string) => {
    if (isAnswering || isSubmitting) return

    setIsAnswering(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 150))
      setSelectedOption(optionId)

      const selected = options.find((o) => o.id === optionId)
      if (selected) {
        onAnswer(selected.text) // ✅ Send actual answer text instead of index ID
      }
    } catch (error) {
      console.error("Error selecting option:", error)
      toast.error("Failed to select option. Please try again.")
    } finally {
      setIsAnswering(false)
    }
  }, [isAnswering, isSubmitting, options, onAnswer])

  const questionText = question?.text || question?.question || "Question not available"

  return (
    <QuizStateProvider>
      <QuizContainer
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        quizType="mcq"
        animationKey={questionNumber}
        quizTitle={quizTitle}
        quizSubtitle={quizSubtitle}
        difficulty={difficulty}
        error={error}
        onRetry={onRetry}
        autoSave={autoSave}
        lastSaved={lastSaved}
        enableKeyboardShortcuts={enableKeyboardShortcuts}
      >
        <div className="space-y-6">
          {/* Question */}
          <div className="space-y-4">
            <h2 
              className="text-xl font-semibold text-foreground leading-relaxed"
              id="question-text"
            >
              {questionText}
            </h2>

            {/* Keyboard hints */}
            {enableKeyboardShortcuts && (
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                <span>Use number keys (1-{options.length}) or letter keys (A-{String.fromCharCode(64 + options.length)}) to select</span>
                <span>Arrow keys to navigate</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3" role="radiogroup" aria-labelledby="question-text">
            <AnimatePresence mode="popLayout">
              {options.map((option, index) => {
                const isSelected = selectedOption === option.id
                const isFocused = focusedIndex === index
                
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    className="relative"
                  >
                    <button
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={isAnswering || isSubmitting}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(-1)}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all duration-200 group",
                        "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        isSelected && "border-primary bg-primary/10 shadow-lg",
                        isFocused && "ring-2 ring-primary/50 ring-offset-1",
                        !isSelected && !isFocused && "border-border bg-background"
                      )}
                      role="radio"
                      aria-checked={isSelected}
                      aria-describedby={`option-${index}-description`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Option Letter */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-200",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "border-muted-foreground text-muted-foreground group-hover:border-primary group-hover:text-primary"
                        )}>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            option.letter
                          )}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium transition-colors duration-200 break-words",
                            isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}>
                            {option.text}
                          </p>
                        </div>

                        {/* Keyboard shortcut hint */}
                        {enableKeyboardShortcuts && (
                          <div className={cn(
                            "flex-shrink-0 px-2 py-1 rounded text-xs border transition-all duration-200",
                            isSelected 
                              ? "bg-primary/20 border-primary/30 text-primary" 
                              : "bg-muted border-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100"
                          )}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Loading overlay */}
                    {isAnswering && isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center"
                      >
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Error state for options */}
          {error && !onRetry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Please select an option to continue</span>
              </div>
            </motion.div>
          )}

          {/* Selected answer confirmation */}
          {selectedOption && !isAnswering && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Answer Selected
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {options.find(o => o.id === selectedOption)?.text}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </QuizContainer>

      <QuizFooter
        onNext={onNext}
        onSubmit={onSubmit}
        onSkip={onSkip}
        onExit={onExit}
        canGoNext={canGoNext && !!selectedOption}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        hasAnswer={!!selectedOption}
        allowSkip={allowSkip}
        skippedQuestions={skippedQuestions}
        unsavedChanges={!!selectedOption && !autoSave}
        enableKeyboardShortcuts={enableKeyboardShortcuts}
      />
    </QuizStateProvider>
  )
}

export default McqQuiz
