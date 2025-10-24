"use client"

import React, { useState, useCallback, useMemo, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, getColorClasses } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { CheckCircle2, Target, Loader2, FileText, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import SyntaxHighlighter from "react-syntax-highlighter";
import atomOneDark from "react-syntax-highlighter/dist/styles/atom-one-dark";

import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { handleError, handleSuccess } from "@/utils/error-handler"
import { HintSystem } from "./HintSystem"
import { useAdaptiveFeedback } from "./AdaptiveFeedbackWrapper"
import { useAuth } from "@/modules/auth"

type QuizQuestionType = 'mcq' | 'blanks' | 'openended' | 'code'

interface BaseQuestion {
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

interface BlanksQuestion extends BaseQuestion {
  type: 'blanks'
  blanks: number
  template: string
}

interface OpenEndedQuestion extends BaseQuestion {
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

type QuizQuestion = MCQQuestion | BlanksQuestion | OpenEndedQuestion | CodeQuestion

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
  quizSlug?: string
  enableAdaptiveFeedback?: boolean
}

// Memoized option component with enterprise Neobrutalism design
const MCQOption = memo(({
  option,
  index,
  isSelected,
  isAnswering,
  isSubmitting,
  onSelect,
  quizType = 'mcq',
}: {
  option: { id: string; text: string; letter: string }
  index: number
  isSelected: boolean
  isAnswering: boolean
  isSubmitting: boolean
  onSelect: (id: string) => void
  quizType?: QuizQuestionType
}) => {
  const styles = getColorClasses(quizType) // Dynamic color based on quiz type
  const isDisabled = isAnswering || isSubmitting

  // Color mappings for different quiz types using theme colors
  const colorMap = {
    mcq: { 
      base: 'hsl(var(--primary))',
      light: 'bg-[hsl(var(--primary))]/10 dark:bg-[hsl(var(--primary))]/20', 
      hover: 'hover:bg-[hsl(var(--primary))]/20 dark:hover:bg-[hsl(var(--primary))]/30',
      text: 'text-[hsl(var(--primary))]',
      bg: 'bg-[hsl(var(--primary))]'
    },
    code: { 
      base: 'hsl(var(--success))',
      light: 'bg-[hsl(var(--success))]/10 dark:bg-[hsl(var(--success))]/20', 
      hover: 'hover:bg-[hsl(var(--success))]/20 dark:hover:bg-[hsl(var(--success))]/30',
      text: 'text-[hsl(var(--success))]',
      bg: 'bg-[hsl(var(--success))]'
    },
    blanks: { 
      base: 'hsl(var(--warning))',
      light: 'bg-[hsl(var(--warning))]/10 dark:bg-[hsl(var(--warning))]/20', 
      hover: 'hover:bg-[hsl(var(--warning))]/20 dark:hover:bg-[hsl(var(--warning))]/30',
      text: 'text-[hsl(var(--warning))]',
      bg: 'bg-[hsl(var(--warning))]'
    },
    openended: { 
      base: 'hsl(var(--accent))',
      light: 'bg-[hsl(var(--accent))]/10 dark:bg-[hsl(var(--accent))]/20', 
      hover: 'hover:bg-[hsl(var(--accent))]/20 dark:hover:bg-[hsl(var(--accent))]/30',
      text: 'text-[hsl(var(--accent))]',
      bg: 'bg-[hsl(var(--accent))]'
    },
  }

  const colors = colorMap[quizType as keyof typeof colorMap] || colorMap.mcq

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.15 }}
      className="group"
    >
      <motion.label
        htmlFor={`option-${option.id}`}
        className={cn(
          "relative flex items-center gap-4 p-4 w-full cursor-pointer transition-all duration-100 overflow-hidden",
          "bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)]",
          isSelected
            ? "bg-[var(--color-accent)] text-[var(--color-text)] shadow-[var(--shadow-neo)]"
            : "bg-[var(--color-card)] text-[var(--color-text)] shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:bg-[var(--color-muted)]",
          isDisabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => !isDisabled && onSelect(option.id)}
        whileHover={!isDisabled ? { y: -2 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      >
        {/* Selection background animation */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-[var(--radius)] bg-[var(--color-accent)] opacity-20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.2 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

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

        <motion.div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-md font-black text-base transition-all duration-100 border-2 border-[var(--color-border)] relative z-10 uppercase",
            isSelected
              ? "bg-[var(--color-text)] text-[var(--color-bg)] shadow-[2px_2px_0_#000]"
              : "bg-[var(--color-muted)] text-[var(--color-text)] hover:bg-[var(--color-accent)] hover:text-[var(--color-text)]"
          )}
          animate={isSelected ? { scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 0.2 }}
        >
          {option.letter}
        </motion.div>

        {/* Option text with enhanced typography and code formatting */}
        <div className={cn(
          "flex-1 text-base font-medium leading-relaxed transition-colors relative z-10",
          isSelected ? `${colors.text} font-bold` : "text-foreground"
        )}>
          {/* Render option text with code formatting support */}
          {(() => {
            const text = option.text;
            
            // Check if option contains code-like elements (backticks, brackets, operators)
            const hasCodeElements = /`.*?`|[\[\]{}()]|===|!==|&&|\|\||->|=>/.test(text);
            
            if (hasCodeElements) {
              // Split by backticks to handle inline code
              const parts = text.split(/(`[^`]+`)/g);
              
              return (
                <span className="flex flex-wrap items-center gap-1">
                  {parts.map((part, idx) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                      // Render code with monospace styling
                      const code = part.slice(1, -1);
                      return (
                        <code 
                          key={idx}
                          className={cn(
                            "px-2 py-1 rounded text-sm font-mono font-semibold border-2 border-border",
                            "bg-muted dark:bg-muted/50",
                            isSelected ? colors.text : "text-foreground"
                          )}
                        >
                          {code}
                        </code>
                      );
                    }
                    // Check if entire text looks like code (no backticks but has code patterns)
                    if (idx === 0 && parts.length === 1 && /^[\w\.\[\]()]+$/.test(part)) {
                      return (
                        <code 
                          key={idx}
                          className={cn(
                            "font-mono font-semibold",
                            isSelected ? colors.text : "text-foreground"
                          )}
                        >
                          {part}
                        </code>
                      );
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </span>
              );
            }
            
            // Regular text without code elements
            return text;
          })()}
        </div>

        {/* Enhanced selection indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 180 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <div className={cn(
                "p-1 border-2 border-border rounded-full shadow-[2px_2px_0px_0px_hsl(var(--border))]",
                colors.bg
              )}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state overlay */}
        <AnimatePresence>
          {isAnswering && isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 backdrop-blur-sm rounded-lg flex items-center justify-center z-20",
                `${colors.light}/80`
              )}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className={cn("w-6 h-6", colors.text)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.label>
    </motion.div>
  )
})

MCQOption.displayName = 'MCQOption'

// Main component with optimized animations
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
  quizSlug,
  enableAdaptiveFeedback = true,
}: UnifiedQuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(existingAnswer || '')
  const [isAnswering, setIsAnswering] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showIncorrectFeedback, setShowIncorrectFeedback] = useState(false)

  // Adaptive feedback integration
  const { isAuthenticated } = useAuth()
  const adaptiveFeedback = useAdaptiveFeedback(
    quizSlug || 'unified-quiz',
    question.id,
    isAuthenticated
  )

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(existingAnswer || '');
    setIsAnswering(false);
    setHintsUsed(0);
    setShowIncorrectFeedback(false);
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
        setSelectedAnswer(optionId)

        const mcqQuestion = question as MCQQuestion
        const selectedOption = mcqQuestion.options[parseInt(optionId)]
        if (selectedOption) {
          onAnswer(selectedOption)
          handleSuccess("Answer selected!")
        }
      } catch (error) {
        handleError(error, { userMessage: "Failed to select answer", context: "Quiz Answer Selection" })
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
        handleSuccess("Answer submitted!")
      }
    } catch (error) {
      handleError(error, { userMessage: "Failed to submit answer", context: "Quiz Answer Submission" })
    } finally {
      setIsAnswering(false)
    }
  }, [selectedAnswer, onAnswer, isAnswering, isSubmitting, question, hintsUsed])

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
      <div className="w-full max-w-3xl mx-auto space-y-3">
        {mcqOptions.map((option, index) => (
          <MCQOption
            key={option.id}
            option={option}
            index={index}
            isSelected={selectedAnswer === option.id}
            isAnswering={isAnswering}
            isSubmitting={isSubmitting}
            onSelect={handleMCQSelect}
            quizType={question.type}
          />
        ))}
      </div>
    )
  }, [mcqOptions, selectedAnswer, isAnswering, isSubmitting, handleMCQSelect, question.type])

  const renderBlanksContent = useCallback(() => {
    const blanksQuestion = question as BlanksQuestion
    const styles = getColorClasses('blanks')

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className={`${styles.cardPrimary} p-8`}>
          {/* Icon Badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 border-3 border-border dark:border-border shadow-[4px_4px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.1)] mb-6">
            <FileText className="w-6 h-6 text-white" />
          </div>
          
          {/* Instruction Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border-2 border-border shadow-[3px_3px_0px_hsl(var(--border))] mb-6">
            <span className="text-sm font-bold text-foreground">Fill in the blanks</span>
          </div>

          {/* Blanks Content */}
          <div className="text-lg leading-relaxed font-medium text-foreground">
            {blanksQuestion.template.split('___').map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && (
                  <input
                    type="text"
                    className={`${styles.input} inline-block w-32 mx-2 text-center`}
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
        </div>

        {question.hints && question.hints.length > 0 && (
          <HintSystem
            hints={question.hints.map((hint, index) => ({
              level: index < 2 ? "low" : "medium" as const,
              type: "contextual" as const,
              content: hint,
              icon: "Lightbulb",
              spoilerLevel: index < 2 ? "low" : "medium" as const,
              penalty: 5 + (index * 3),
              description: `Hint ${index + 1}`
            }))}
            onHintUsed={() => setHintsUsed(prev => prev + 1)}
            questionText={question.text || question.question}
          />
        )}
      </div>
    )
  }, [question, selectedAnswer, isAnswering, isSubmitting, handleTextInput])

  const renderOpenEndedContent = useCallback(() => {
    const openEndedQuestion = question as OpenEndedQuestion
    const wordCount = selectedAnswer.trim().split(/\s+/).filter(word => word.length > 0).length
    const minWords = openEndedQuestion.minWords || 10
    const maxWords = openEndedQuestion.maxWords || 200
    const styles = getColorClasses('openended')

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className={`${styles.cardPrimary} p-8`}>
          {/* Icon Badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 border-3 border-border dark:border-border shadow-[4px_4px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.1)] mb-6">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          
          {/* Instruction Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border-2 border-border shadow-[3px_3px_0px_hsl(var(--border))] mb-6">
            <span className="text-sm font-bold text-foreground">Write your answer</span>
          </div>

          {/* Textarea */}
          <textarea
            placeholder="Type your answer here..."
            value={selectedAnswer}
            onChange={(e) => handleTextInput(e.target.value)}
            className={`${styles.input} min-h-[180px] w-full text-base leading-relaxed resize-none`}
            disabled={isAnswering || isSubmitting}
          />

          {/* Character Counter */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Word count:</span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 border-2 border-border text-sm font-bold text-foreground">
                {wordCount}
              </span>
            </div>
            <div className={cn(
              "px-3 py-1 border-2 border-border text-sm font-bold",
              wordCount < minWords && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
              wordCount > maxWords && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
              wordCount >= minWords && wordCount <= maxWords && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
            )}>
              {wordCount < minWords ? `${minWords - wordCount} more words needed` :
               wordCount > maxWords ? `${wordCount - maxWords} words over limit` :
               "Good length ✓"}
            </div>
          </div>
        </div>

        {question.hints && question.hints.length > 0 && (
          <HintSystem
            hints={question.hints.map((hint, index) => ({
              level: index < 2 ? "low" : "medium" as const,
              type: "contextual" as const,
              content: hint,
              icon: "Lightbulb",
              spoilerLevel: index < 2 ? "low" : "medium" as const,
              penalty: 5 + (index * 3),
              description: `Hint ${index + 1}`
            }))}
            onHintUsed={() => setHintsUsed(prev => prev + 1)}
            questionText={question.text || question.question}
          />
        )}
      </div>
    )
  }, [question, selectedAnswer, isAnswering, isSubmitting, handleTextInput])

  const renderCodeContent = useCallback(() => {
    const codeQuestion = question as CodeQuestion
    const styles = getColorClasses('code') // Code uses green accent (#10B981)

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {codeQuestion.codeSnippet && (
          <div className={cn(
            styles.cardPrimary,
            "p-6 bg-white"
          )}>
            {/* Code snippet header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 bg-green-500 border-2 border-border rounded-md shadow-[2px_2px_0px_0px_hsl(var(--border))]"
                )}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-base font-bold text-foreground uppercase">Code Snippet</span>
              </div>
              
              {/* Language badge */}
              <span className={cn(
                getColorClasses().badge,
                "text-xs font-mono font-black",
                "bg-green-500 text-white px-3 py-1 rounded-lg border-4 border-black shadow-[3px_3px_0_#000]"
              )}>
                {codeQuestion.language || 'JAVASCRIPT'}
              </span>
            </div>
            
            {/* Code editor with toned-down Neobrutalism border */}
            <div className="rounded-lg overflow-hidden border-3 border-border shadow-[6px_6px_0px_0px_hsl(var(--border))]">
              <SyntaxHighlighter
                language={codeQuestion.language || 'javascript'}
                style={atomOneDark}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  borderRadius: '0',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                }}
              >
                {codeQuestion.codeSnippet}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {codeQuestion.options && codeQuestion.options.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-center text-foreground uppercase">
              Select the correct option:
            </h3>
            {renderMCQContent()}
          </div>
        )}
      </div>
    )
  }, [question, renderMCQContent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("w-full space-y-8", className)}
    >
      {/* Question Header with Enterprise Neobrutalism */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Question Progress Badge */}
          <Badge variant="neutral" className={cn(neo.badge, "inline-flex items-center gap-2 bg-secondary/10 text-foreground")}>
            <Target className="w-3 h-3" />
            Question {questionNumber} / {totalQuestions}
          </Badge>

          {/* Difficulty Badge */}
          {question.difficulty && (
            <Badge variant="neutral" className={cn(neo.badge, question.difficulty === 'easy' ? 'bg-[var(--color-success)] text-white' : question.difficulty === 'medium' ? 'bg-[var(--color-warning)] text-white' : 'bg-[var(--color-destructive)] text-white')}>
              {question.difficulty.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Question Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight px-4 max-w-4xl mx-auto"
        >
          {questionText}
        </motion.h2>

        {/* Quiz Type Indicator with Dynamic Colors */}
        <div className="flex items-center justify-center">
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-xl", neo.inner, "bg-secondary/50")}>
            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-sm font-bold text-foreground uppercase">
              {question.type === 'mcq' && 'Multiple Choice'}
              {question.type === 'blanks' && 'Fill in the Blanks'}
              {question.type === 'openended' && 'Open Ended'}
              {question.type === 'code' && 'Code Question'}
            </span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      {renderQuestionContent()}

      {/* Action Buttons for Text-based Questions */}
      {(question.type === 'blanks' || question.type === 'openended') && (
        <div className="flex justify-center">
          <Button
            onClick={handleTextSubmit}
            disabled={!selectedAnswer.trim() || isAnswering || isSubmitting}
            className={cn(
              // Keep adaptive color from getColorClasses but reduce the CTA shadow
              "min-w-[180px]",
              "shadow-[4px_4px_0px_0px_hsl(var(--border))]",
              (getColorClasses as any)(question.type).buttonPrimary
            )}
            size="lg"
          >
            {isAnswering ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// Export memoized component
export const UnifiedQuizQuestion = memo(UnifiedQuizQuestionComponent)
