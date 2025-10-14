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
import { generateHints } from "@/lib/utils/hint-system-unified"
import { handleError, handleSuccess } from "@/utils/error-handler"
import { HintSystem } from "./HintSystem"
import { AdaptiveFeedbackWrapper, useAdaptiveFeedback } from "./AdaptiveFeedbackWrapper"
import { useAuth } from "@/modules/auth"

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
  quizSlug?: string
  enableAdaptiveFeedback?: boolean
}

// Memoized option component with clean animations
const MCQOption = memo(({
  option,
  index,
  isSelected,
  isAnswering,
  isSubmitting,
  onSelect,
}: {
  option: { id: string; text: string; letter: string }
  index: number
  isSelected: boolean
  isAnswering: boolean
  isSubmitting: boolean
  onSelect: (id: string) => void
}) => {
  const isDisabled = isAnswering || isSubmitting

  return (
    <motion.div
      key={option.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className="group relative"
    >
      <label
        htmlFor={`option-${option.id}`}
        className={cn(
          "relative flex items-center gap-4 p-4 w-full rounded-xl cursor-pointer transition-all duration-200 border-2",
          "bg-card hover:bg-accent/50",
          isSelected
            ? "border-primary bg-primary/5 shadow-md"
            : "border-border hover:border-primary/50",
          isDisabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => !isDisabled && onSelect(option.id)}
      >
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

        {/* Letter indicator */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg font-semibold transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/20"
          )}
        >
          {option.letter}
        </div>

        {/* Option text */}
        <div className="flex-1 text-sm font-medium leading-relaxed text-foreground">
          {option.text}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-primary"
          >
            {isAnswering ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </motion.div>
        )}
      </label>
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
          />
        ))}
      </div>
    )
  }, [mcqOptions, selectedAnswer, isAnswering, isSubmitting, handleMCQSelect])

  const renderBlanksContent = useCallback(() => {
    const blanksQuestion = question as BlanksQuestion

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <Card>
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
                      className="inline-block w-24 mx-2 text-center border-2 border-dashed border-primary/50 focus:border-primary"
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
      </div>
    )
  }, [question, selectedAnswer, isAnswering, isSubmitting, handleTextInput])

  const renderOpenEndedContent = useCallback(() => {
    const openEndedQuestion = question as OpenEndedQuestion
    const wordCount = selectedAnswer.trim().split(/\s+/).filter(word => word.length > 0).length
    const minWords = openEndedQuestion.minWords || 10
    const maxWords = openEndedQuestion.maxWords || 200

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <Card>
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
      </div>
    )
  }, [question, selectedAnswer, isAnswering, isSubmitting, handleTextInput])

  const renderCodeContent = useCallback(() => {
    const codeQuestion = question as CodeQuestion

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {codeQuestion.codeSnippet && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Code Snippet</span>
                <Badge variant="secondary" className="text-xs font-mono ml-auto">
                  {codeQuestion.language || 'javascript'}
                </Badge>
              </div>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language={codeQuestion.language || 'javascript'}
                  style={atomOneDark}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
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
      {/* Question Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Badge variant="secondary" className="text-sm">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          {question.difficulty && (
            <Badge 
              variant="outline"
              className={cn(
                "text-sm",
                question.difficulty === 'easy' && "text-green-600",
                question.difficulty === 'medium' && "text-yellow-600",
                question.difficulty === 'hard' && "text-red-600"
              )}
            >
              {question.difficulty}
            </Badge>
          )}
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-foreground leading-tight px-4"
        >
          {questionText}
        </motion.h2>

        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
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
            className="min-w-[160px]"
            size="lg"
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
        </div>
      )}
    </motion.div>
  )
}

// Export memoized component
export const UnifiedQuizQuestion = memo(UnifiedQuizQuestionComponent)
export default UnifiedQuizQuestion