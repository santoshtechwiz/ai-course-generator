"use client"

import React, { useState, useCallback, useMemo, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle2, Target, Loader2, AlertCircle, Lightbulb, FileText, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import SyntaxHighlighter from "react-syntax-highlighter";
import atomOneDark from "react-syntax-highlighter/dist/styles/atom-one-dark";

import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateBlanksHints, generateOpenEndedHints } from "@/lib/utils/hint-system"
import { toast } from "sonner"
import { HintSystem } from "./HintSystem"

// Optimized animation variants with reduced complexity
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -60, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    x: 60,
    transition: { duration: 0.3 },
  },
}

// Optimized option animation variants
const optionVariants = {
  hidden: (index: number) => ({
    opacity: 0,
    x: -80,
    scale: 0.9,
    transition: { delay: index * 0.05 }
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      delay: index * 0.05,
    }
  }),
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  selected: {
    scale: 1.03,
    transition: { duration: 0.3 }
  }
}

// Smooth slide animation for progress
const slideVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  }
}

export type QuizQuestionType = 'mcq' | 'blanks' | 'openended' | 'code'

export interface BaseQuestion {
  id: string
  text?: string
  question?: string
  type: QuizQuestionType
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  hints?: string[]
  explanation?: string
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq'
  options: string[]
}

export interface BlanksQuestion extends BaseQuestion {
  type: 'blanks'
  blanks: number
  template: string
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'openended'
  minWords?: number
  maxWords?: number
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code'
  codeSnippet?: string
  language?: string
  options?: string[]
}

export type QuizQuestion = MCQQuestion | BlanksQuestion | OpenEndedQuestion | CodeQuestion

interface UnifiedQuizQuestionProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  existingAnswer?: string
  onAnswer: (answer: string, similarity?: number, hintsUsed?: number) => boolean
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  isSubmitting?: boolean
  showRetake?: boolean
  timeSpent?: number
  className?: string
}

// Memoized option component to prevent unnecessary re-renders
const MCQOption = memo(({
  option,
  index,
  isSelected,
  isAnswering,
  isSubmitting,
  onSelect,
  onHover,
  onFocus,
  onKeyDown
}: {
  option: { id: string; text: string; letter: string }
  index: number
  isSelected: boolean
  isAnswering: boolean
  isSubmitting: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onFocus: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent, id: string) => void
}) => {
  const isDisabled = isAnswering || isSubmitting

  return (
    <motion.div
      key={option.id}
      custom={index}
      variants={optionVariants}
      initial="hidden"
      exit="exit"
      whileHover={!isDisabled ? "hover" : undefined}
      whileTap={!isDisabled ? "tap" : undefined}
      onHoverStart={() => !isDisabled && onHover(option.id)}
      onHoverEnd={() => onHover(null)}
      className="group relative"
    >
      {/* Background glow effect - only render when needed */}
      {!isDisabled && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      )}

      <label
        htmlFor={`option-${option.id}`}
        className={cn(
          "relative flex items-center gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-5 lg:p-6 w-full rounded-2xl cursor-pointer transition-all duration-300",
          "bg-gradient-to-br from-card/90 via-card/95 to-card/90 backdrop-blur-xl border border-border/50",
          "min-h-[3.5rem] sm:min-h-[4rem] lg:min-h-[4.5rem]",
          "shadow-lg hover:shadow-xl",
          isSelected
            ? "border-primary/60 bg-gradient-to-br from-primary/8 via-primary/5 to-primary/8 shadow-xl shadow-primary/20"
            : "hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/3 hover:via-primary/2 hover:to-primary/3",
          isDisabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => !isDisabled && onSelect(option.id)}
        onKeyDown={(e) => !isDisabled && onKeyDown(e, option.id)}
        onFocus={() => onFocus(option.id)}
        onBlur={() => onHover(null)}
        tabIndex={isDisabled ? -1 : 0}
        role="radio"
        aria-checked={isSelected}
        aria-disabled={isDisabled}
      >
        {/* Optimized background pattern - conditionally rendered */}
        {!isDisabled && (
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-xl transform -translate-x-6 translate-y-6" />
          </div>
        )}

        <input
          type="radio"
          name="mcq-option"
          id={`option-${option.id}`}
          value={option.id}
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => !isDisabled && onSelect(option.id)}
          className="sr-only"
        />

        {/* Letter circle - increased for 44px+ touch target */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl font-bold text-base sm:text-lg lg:text-xl flex-shrink-0 transition-all duration-300 z-10",
            "bg-gradient-to-br shadow-lg",
            isSelected
              ? "from-primary via-primary to-primary/90 text-primary-foreground shadow-primary/40"
              : "from-muted via-muted/80 to-muted/60 text-muted-foreground group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/10 group-hover:text-primary group-hover:border-primary/30"
          )}
          whileHover={!isDisabled ? { scale: 1.1 } : undefined}
          whileTap={!isDisabled ? { scale: 0.95 } : undefined}
          aria-hidden="true"
        >
          <span className="relative z-10">{option.letter}</span>
        </motion.div>

        {/* Text content */}
        <div
          className="relative flex-1 text-sm sm:text-base font-medium leading-relaxed min-w-0 text-foreground group-hover:text-primary transition-colors duration-300 z-10 break-words"
        >
          {option.text}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative flex-shrink-0 z-10"
            aria-hidden="true"
          >
            {isAnswering ? (
              <div className="relative w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : (
              <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-full flex items-center justify-center shadow-xl shadow-primary/40 border border-primary/20">
                <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
          </motion.div>
        )}
      </label>
    </motion.div>
  )
})

MCQOption.displayName = 'MCQOption'

// Main component with memoization
function UnifiedQuizQuestionComponent({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer,
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false,
  showRetake = false,
  timeSpent,
  className,
}: UnifiedQuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(existingAnswer || '')
  const [isAnswering, setIsAnswering] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [focusedOption, setFocusedOption] = useState<string | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHints, setShowHints] = useState(false)

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(existingAnswer || '');
    setIsAnswering(false);
    setHoveredOption(null);
    setFocusedOption(null);
    setHintsUsed(0);
    setShowHints(false);
  }, [question.id, existingAnswer]);

  // Memoized question text
  const questionText = useMemo(() => 
    question.text || question.question || "Question not available",
    [question.text, question.question]
  )

  // Optimized MCQ selection handler
  const handleMCQSelect = useCallback(
    async (optionId: string) => {
      if (isAnswering || isSubmitting) return

      setIsAnswering(true)

      try {
        // Use requestAnimationFrame for better performance
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
        
        setSelectedAnswer(optionId)

        const mcqQuestion = question as MCQQuestion
        const selectedOption = mcqQuestion.options[parseInt(optionId)]
        if (selectedOption) {
          onAnswer(selectedOption)
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
    [onAnswer, isAnswering, isSubmitting, question]
  )

  // Optimized text input handler
  const handleTextInput = useCallback(
    (value: string) => {
      setSelectedAnswer(value)
    },
    []
  )

  // Optimized text submission handler
  const handleTextSubmit = useCallback(async () => {
    if (isAnswering || isSubmitting || !selectedAnswer.trim()) return

    setIsAnswering(true)

    try {
      let similarity = 0
      if (question.type === 'blanks' || question.type === 'openended') {
        const similarityResult = calculateAnswerSimilarity(selectedAnswer, question.explanation || '')
        similarity = similarityResult.similarity
      }

      const success = onAnswer(selectedAnswer, similarity, hintsUsed)

      if (success) {
        toast.success("Answer submitted!", {
          duration: 1000,
          position: "top-center",
        })
      }
    } catch (error) {
      toast.error("Failed to submit answer")
    } finally {
      setIsAnswering(false)
    }
  }, [selectedAnswer, onAnswer, isAnswering, isSubmitting, question, hintsUsed])

  // Optimized keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, optionId: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleMCQSelect(optionId)
      }
    },
    [handleMCQSelect]
  )

  // Focus management
  const handleFocus = useCallback((optionId: string) => {
    setFocusedOption(optionId)
  }, [])

  const handleHover = useCallback((optionId: string | null) => {
    setHoveredOption(optionId)
  }, [])

  // Memoized MCQ options
  const mcqOptions = useMemo(() => {
    const mcqQuestion = question as MCQQuestion
    return mcqQuestion.options.map((option, index) => ({
      id: `${index}`,
      text: option,
      letter: String.fromCharCode(65 + index),
    }))
  }, [question])

  // Render different question types
  const renderQuestionContent = useCallback(() => {
    switch (question.type) {
      case 'mcq':
        return renderMCQContent()
      case 'blanks':
        return renderBlanksContent()
      case 'openended':
        return renderOpenEndedContent()
      case 'code':
        return renderCodeContent()
      default:
        return <div>Unsupported question type</div>
    }
  }, [question, selectedAnswer, isAnswering, isSubmitting, hintsUsed])

  const renderMCQContent = useCallback(() => {
    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
        <motion.div
          className="space-y-3 sm:space-y-4"
          role="radiogroup"
          aria-labelledby="question-text"
          aria-describedby="question-instructions"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {mcqOptions.map((option, index) => (
            <MCQOption
              key={option.id}
              option={option}
              index={index}
              isSelected={selectedAnswer === option.id}
              isAnswering={isAnswering}
              isSubmitting={isSubmitting}
              onSelect={handleMCQSelect}
              onHover={handleHover}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
            />
          ))}
        </motion.div>
      </div>
    )
  }, [mcqOptions, selectedAnswer, isAnswering, isSubmitting, handleMCQSelect, handleHover, handleFocus, handleKeyDown])

  const renderBlanksContent = useCallback(() => {
    const blanksQuestion = question as BlanksQuestion

    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-3xl mx-auto space-y-6"
      >
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Fill in the blanks</span>
            </div>
            <div className="text-base leading-relaxed">
              {blanksQuestion.template.split('___').map((part, index, array) => (
                <React.Fragment key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <Input
                      className="inline-block w-20 sm:w-24 md:w-32 mx-1 sm:mx-2 text-center border-2 border-dashed border-primary/50 focus:border-primary"
                      placeholder={`Blank ${index + 1}`}
                      value={selectedAnswer.split('___')[index] || ''}
                      onChange={(e) => {
                        const answers = selectedAnswer.split('___')
                        answers[index] = e.target.value
                        handleTextInput(answers.join('___'))
                      }}
                      disabled={isAnswering || isSubmitting}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {question.hints && question.hints.length > 0 && (
          <HintSystem
            hints={question.hints.map((hint, index) => ({
              level: index < 2 ? "low" : "medium" as const,
              type: "contextual" as const,
              content: hint,
              spoilerLevel: index < 2 ? "low" : "medium" as const,
              penalty: 5 + (index * 3),
              description: `Hint ${index + 1}`
            }))}
            onHintUsed={() => setHintsUsed(prev => prev + 1)}
            questionText={question.text || question.question}
          />
        )}
      </motion.div>
    )
  }, [question, selectedAnswer, isAnswering, isSubmitting, handleTextInput])

  const renderOpenEndedContent = useCallback(() => {
    const openEndedQuestion = question as OpenEndedQuestion
    const wordCount = selectedAnswer.trim().split(/\s+/).filter(word => word.length > 0).length
    const minWords = openEndedQuestion.minWords || 10
    const maxWords = openEndedQuestion.maxWords || 200

    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-3xl mx-auto space-y-6"
      >
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Write your answer</span>
            </div>
            <Textarea
              placeholder="Type your answer here..."
              value={selectedAnswer}
              onChange={(e) => handleTextInput(e.target.value)}
              className="min-h-[120px] text-base leading-relaxed resize-none"
              disabled={isAnswering || isSubmitting}
            />
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Word count: {wordCount}</span>
              <span className={cn(
                wordCount < minWords && "text-orange-500",
                wordCount > maxWords && "text-red-500",
                wordCount >= minWords && wordCount <= maxWords && "text-green-500"
              )}>
                {wordCount < minWords ? `${minWords - wordCount} more words needed` :
                 wordCount > maxWords ? `${wordCount - maxWords} words over limit` :
                 "Good length"}
              </span>
            </div>
          </CardContent>
        </Card>

        {question.hints && question.hints.length > 0 && (
          <HintSystem
            hints={question.hints.map((hint, index) => ({
              level: index < 2 ? "low" : "medium" as const,
              type: "contextual" as const,
              content: hint,
              spoilerLevel: index < 2 ? "low" : "medium" as const,
              penalty: 5 + (index * 3),
              description: `Hint ${index + 1}`
            }))}
            onHintUsed={() => setHintsUsed(prev => prev + 1)}
            questionText={question.text || question.question}
          />
        )}
      </motion.div>
    )
  }, [question, selectedAnswer, isAnswering, isSubmitting, handleTextInput])

  const renderCodeContent = useCallback(() => {
    const codeQuestion = question as CodeQuestion

    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto space-y-6"
      >
        {codeQuestion.codeSnippet && (
          <Card className="bg-muted/30">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Code Snippet</span>
                <Badge variant="secondary" className="text-xs font-mono ml-auto">
                  {codeQuestion.language || 'javascript'}
                </Badge>
              </div>
              <div className="rounded-lg overflow-hidden relative group">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                  <SyntaxHighlighter
                    language={codeQuestion.language || 'javascript'}
                    style={atomOneDark}
                    showLineNumbers={false}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgb(15 23 42)',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
                      whiteSpace: 'pre',
                      wordBreak: 'normal',
                      overflowWrap: 'normal',
                    }}
                    codeTagProps={{
                      style: {
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        lineHeight: 'inherit',
                        whiteSpace: 'pre',
                        wordBreak: 'normal',
                        overflowWrap: 'normal',
                      }
                    }}
                  >
                    {codeQuestion.codeSnippet}
                  </SyntaxHighlighter>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {codeQuestion.options && codeQuestion.options.length > 0 && (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-center">Select the correct option:</h3>
            {renderMCQContent()}
          </motion.div>
        )}
      </motion.div>
    )
  }, [question, renderMCQContent])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("w-full space-y-8", className)}
    >
      {/* Skip Link for Accessibility */}
      <a
        href="#quiz-navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to quiz navigation
      </a>

      {/* Quiz Title for Screen Readers */}
      <h1 id="quiz-title" className="sr-only">
        Question {questionNumber} of {totalQuestions}
      </h1>

      {/* Enhanced Question Header */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="text-center space-y-4"
      >
        {/* Enhanced Question Text */}
        <motion.div
          className="relative max-w-4xl mx-auto px-2 sm:px-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-2xl transform scale-110" />

          <h2
            className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent leading-tight tracking-tight px-4 sm:px-6 py-4 break-words"
            id="question-text"
            tabIndex={-1}
          >
            {questionText}

            {/* Decorative underline */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ delay: 0.5, duration: 0.6 }}
            />
          </h2>
        </motion.div>

        {/* Modern Question Type Indicator */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-muted/40 to-muted/20 border border-border/50 rounded-2xl backdrop-blur-sm"
            role="region"
            aria-label="Question type information"
            id="question-instructions"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-lg">
                <Target className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
            </div>
            <span className="text-sm sm:text-base font-medium text-muted-foreground">
              {question.type === 'mcq' && 'Select the best answer from the options below'}
              {question.type === 'blanks' && 'Fill in the blanks with the correct answers'}
              {question.type === 'openended' && 'Write a detailed answer to the question'}
              {question.type === 'code' && 'Review the code and select the correct option'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Question Content */}
      {renderQuestionContent()}

      {/* Action Buttons for Text-based Questions */}
      {(question.type === 'blanks' || question.type === 'openended') && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="flex justify-center"
        >
          <Button
            onClick={handleTextSubmit}
            disabled={!selectedAnswer.trim() || isAnswering || isSubmitting}
            className="min-w-[160px] h-14 px-8 text-lg font-semibold"
          >
            {isAnswering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Answer
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// Export memoized component
export const UnifiedQuizQuestion = memo(UnifiedQuizQuestionComponent)
export default UnifiedQuizQuestion