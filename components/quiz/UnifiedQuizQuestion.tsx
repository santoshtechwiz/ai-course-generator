"use client"

import React, { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CheckCircle2, Target, Loader2, AlertCircle, Lightbulb, FileText, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism"
import { HintSystem } from "@/components/quiz/HintSystem"
import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateBlanksHints, generateOpenEndedHints } from "@/lib/utils/hint-system"
import { toast } from "sonner"

// Enhanced animation variants with modern easing
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.12
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -40,
    scale: 0.9,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// Modern bounce animation for selections
const bounceVariants = {
  bounce: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      ease: [0.68, -0.55, 0.265, 1.55],
    }
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
      stiffness: 200,
      damping: 25,
      ease: [0.25, 0.46, 0.45, 0.94],
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

export function UnifiedQuizQuestion({
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

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    return Math.round(((questionNumber - 1) / totalQuestions) * 100)
  }, [questionNumber, totalQuestions])

  const questionText = question.text || question.question || "Question not available"

  // Handle MCQ option selection
  const handleMCQSelect = useCallback(
    async (optionId: string) => {
      if (isAnswering || isSubmitting) return

      setIsAnswering(true)

      try {
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        await new Promise((resolve) => setTimeout(resolve, 150))
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

  // Handle text input (blanks/openended)
  const handleTextInput = useCallback(
    (value: string) => {
      setSelectedAnswer(value)
    },
    []
  )

  // Handle text answer submission
  const handleTextSubmit = useCallback(async () => {
    if (isAnswering || isSubmitting || !selectedAnswer.trim()) return

    setIsAnswering(true)

    try {
      let similarity = 0
      if (question.type === 'blanks' || question.type === 'openended') {
        // Calculate similarity for text-based questions
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

  // Handle keyboard navigation for MCQ
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

  const handleBlur = useCallback(() => {
    setFocusedOption(null)
  }, [])

  // Render different question types
  const renderQuestionContent = () => {
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
  }

  const renderMCQContent = () => {
    const mcqQuestion = question as MCQQuestion
    const options = mcqQuestion.options.map((option, index) => ({
      id: `${index}`,
      text: option,
      letter: String.fromCharCode(65 + index),
    }))

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div
          className="space-y-3 sm:space-y-4"
          role="radiogroup"
          aria-labelledby="question-text"
          aria-describedby="question-instructions"
        >
          <AnimatePresence>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option.id
              const isHovered = hoveredOption === option.id
              const isFocused = focusedOption === option.id
              const isDisabled = isAnswering || isSubmitting

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isSelected ? 1.03 : 1,
                    boxShadow: isSelected
                      ? "0 20px 40px rgba(var(--primary), 0.25), 0 0 0 1px rgba(var(--primary), 0.1)"
                      : isHovered
                        ? "0 15px 30px rgba(var(--primary), 0.15), 0 0 0 1px rgba(var(--primary), 0.05)"
                        : "0 4px 20px rgba(0, 0, 0, 0.08)"
                  }}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    scale: { duration: 0.4, ease: "easeOut" },
                    boxShadow: { duration: 0.3 }
                  }}
                  whileHover={!isDisabled ? {
                    scale: 1.02,
                    y: -3,
                    boxShadow: "0 25px 50px rgba(var(--primary), 0.2), 0 0 0 1px rgba(var(--primary), 0.08)"
                  } : {}}
                  whileTap={!isDisabled ? {
                    scale: 0.98,
                    transition: { duration: 0.15, ease: "easeInOut" }
                  } : {}}
                  onHoverStart={() => !isDisabled && setHoveredOption(option.id)}
                  onHoverEnd={() => setHoveredOption(null)}
                  className="group relative"
                >
                  {/* Background glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

                  <label
                    htmlFor={`option-${option.id}`}
                    className={cn(
                      "relative flex items-center gap-4 sm:gap-5 lg:gap-6 p-3 sm:p-4 lg:p-5 w-full rounded-2xl cursor-pointer transition-all duration-500 overflow-hidden",
                      "bg-gradient-to-br from-card/90 via-card/95 to-card/90 backdrop-blur-xl border border-border/50",
                      "min-h-[3rem] sm:min-h-[3.5rem] lg:min-h-[4rem]",
                      "shadow-lg hover:shadow-2xl",
                      isSelected
                        ? "border-primary/60 bg-gradient-to-br from-primary/8 via-primary/5 to-primary/8 shadow-2xl shadow-primary/20"
                        : isHovered || isFocused
                          ? "border-primary/40 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5 shadow-xl shadow-primary/10"
                          : "hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/3 hover:via-primary/2 hover:to-primary/3",
                      isDisabled && "opacity-60 cursor-not-allowed",
                      isFocused && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => !isDisabled && handleMCQSelect(option.id)}
                    onKeyDown={(e) => !isDisabled && handleKeyDown(e, option.id)}
                    onFocus={() => handleFocus(option.id)}
                    onBlur={handleBlur}
                    tabIndex={isDisabled ? -1 : 0}
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={isDisabled}
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-xl transform -translate-x-6 translate-y-6" />
                    </div>

                    <input
                      type="radio"
                      name="mcq-option"
                      id={`option-${option.id}`}
                      value={option.id}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && handleMCQSelect(option.id)}
                      className="sr-only"
                      aria-describedby={`option-description-${option.id}`}
                    />

                    {/* Enhanced letter circle with gradient */}
                    <motion.div
                      className={cn(
                        "relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl font-bold text-sm sm:text-base lg:text-lg flex-shrink-0 transition-all duration-500 z-10",
                        "bg-gradient-to-br shadow-lg",
                        isSelected
                          ? "from-primary via-primary to-primary/90 text-primary-foreground shadow-primary/40"
                          : isHovered
                            ? "from-primary/20 via-primary/15 to-primary/10 text-primary border-2 border-primary/50 shadow-primary/20"
                            : "from-muted via-muted/80 to-muted/60 text-muted-foreground group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/10 group-hover:text-primary group-hover:border-primary/30"
                      )}
                      whileHover={!isDisabled ? {
                        scale: 1.15,
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.6, ease: "easeOut" }
                      } : {}}
                      whileTap={!isDisabled ? { scale: 0.9, transition: { duration: 0.1 } } : {}}
                      animate={isSelected ? {
                        scale: [1, 1.25, 1.1],
                        rotate: [0, 15, -5, 0],
                        transition: { duration: 0.8, ease: "easeOut" }
                      } : {}}
                      aria-hidden="true"
                    >
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10">{option.letter}</span>
                    </motion.div>

                    {/* Enhanced text content */}
                    <div
                      className="relative flex-1 text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed min-w-0 text-foreground group-hover:text-primary transition-all duration-300 z-10"
                      id={`option-description-${option.id}`}
                    >
                      <span className="relative">
                        {option.text}
                        {/* Subtle text glow on hover */}
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                      </span>
                    </div>

                    {/* Enhanced selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                          delay: 0.2
                        }}
                        className="relative flex-shrink-0 z-10"
                        aria-hidden="true"
                      >
                        <div className="relative">
                          {/* Pulsing background */}
                          <motion.div
                            className="absolute inset-0 bg-primary/20 rounded-full"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          {isAnswering ? (
                            <div className="relative w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </div>
                          ) : (
                            <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-full flex items-center justify-center shadow-xl shadow-primary/40 border border-primary/20">
                              <CheckCircle2 className="w-6 h-6 text-primary-foreground drop-shadow-sm" />
                              {/* Success sparkle effect */}
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                animate={{
                                  boxShadow: [
                                    "0 0 0 0 rgba(var(--primary), 0.4)",
                                    "0 0 0 8px rgba(var(--primary), 0)",
                                    "0 0 0 0 rgba(var(--primary), 0)"
                                  ]
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeOut"
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Hover indicator */}
                    {!isSelected && isHovered && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary/60 rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </label>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  const renderBlanksContent = () => {
    const blanksQuestion = question as BlanksQuestion

    return (
      <motion.div
        variants={itemVariants}
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
                      className="inline-block w-32 mx-2 text-center border-2 border-dashed border-primary/50 focus:border-primary"
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
  }

  const renderOpenEndedContent = () => {
    const openEndedQuestion = question as OpenEndedQuestion
    const wordCount = selectedAnswer.trim().split(/\s+/).filter(word => word.length > 0).length
    const minWords = openEndedQuestion.minWords || 10
    const maxWords = openEndedQuestion.maxWords || 200

    return (
      <motion.div
        variants={itemVariants}
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
  }

  const renderCodeContent = () => {
    const codeQuestion = question as CodeQuestion

    return (
      <motion.div
        variants={itemVariants}
        className="w-full max-w-4xl mx-auto space-y-6"
      >
        {codeQuestion.codeSnippet && (
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Code Snippet</span>
              </div>
              <div className="rounded-lg overflow-hidden relative group">
                <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {codeQuestion.language || 'javascript'}
                  </Badge>
                </div>
                <SyntaxHighlighter
                  language={codeQuestion.language || 'javascript'}
                  style={vscDarkPlus}
                  className="text-sm !bg-zinc-950 !p-6 !m-0"
                  showLineNumbers={true}
                  wrapLines={true}
                  customStyle={{
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  {codeQuestion.codeSnippet}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        )}

        {codeQuestion.options && codeQuestion.options.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Select the correct option:</h3>
            {renderMCQContent()}
          </div>
        )}
      </motion.div>
    )
  }

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

      {/* Enhanced Question Header - Compact Version */}
      <motion.div
        variants={itemVariants}
        className="text-center space-y-4"
      >
        {/* Modern Question Number Badge - REMOVED for more space */}

        {/* Enhanced Progress Bar - REMOVED for more space */}

        {/* Enhanced Question Text */}
        <motion.div
          className="relative max-w-5xl mx-auto px-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-2xl transform scale-110" />

          <h2
            className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent leading-tight tracking-tight px-6 py-4"
            id="question-text"
            tabIndex={-1}
          >
            {questionText}

            {/* Decorative underline */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            />
          </h2>
        </motion.div>

        {/* Modern Question Type Indicator */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
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
          className="flex justify-center"
        >
          <Button
            onClick={handleTextSubmit}
            disabled={!selectedAnswer.trim() || isAnswering || isSubmitting}
            className="min-w-[160px] h-12 px-6 text-base font-semibold"
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

export default UnifiedQuizQuestion