"use client"
import React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, BookOpen, Lightbulb, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateHints } from "@/lib/utils/hint-system-unified"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useOptionalQuizState } from "@/components/quiz/QuizStateProvider"
import { AdaptiveFeedbackWrapper, useAdaptiveFeedback } from "@/components/quiz/AdaptiveFeedbackWrapper"
import { useAuth } from "@/modules/auth"
import { containerVariants, itemVariants } from "../../components/animations/quiz-animations"

interface OpenEndedQuizProps {
  question: any
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
  timeSpent?: number
  slug?: string
}

export default function OpenEndedQuiz({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer = "",
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  timeSpent = 0,
  slug,
}: OpenEndedQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [keywordsCovered, setKeywordsCovered] = useState<string[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const pendingResetRef = useRef(false)
  const pendingResetValueRef = useRef<string | null>(null)

  // Adaptive feedback integration
  const { isAuthenticated } = useAuth()
  const adaptiveFeedback = useAdaptiveFeedback(
    slug || 'unknown-quiz',
    question.id,
    isAuthenticated
  )

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const openEndedData = question || {}
    return {
      text: question.question || question.text || "",
      answer: question.answer || openEndedData.correctAnswer || "",
      // keywords may be stored under `tags`, `keywords`, or `keyphrases` depending on source
      keywords: Array.isArray(openEndedData.keywords)
        ? openEndedData.keywords
        : Array.isArray(openEndedData.tags)
        ? openEndedData.tags
        : Array.isArray(openEndedData.keyphrases)
        ? openEndedData.keyphrases
        : [],
      // Hints may be strings or objects; keep raw and let generator normalize
      hints: Array.isArray(openEndedData.hints) ? openEndedData.hints : [],
      difficulty: openEndedData.difficulty || question.difficulty || "Medium",
      tags: Array.isArray(openEndedData.tags) ? openEndedData.tags : Array.isArray(openEndedData.keywords) ? openEndedData.keywords : [],
    }
  }, [question])

  // Determine expected answer length based on question and answer characteristics
  const expectedLength = useMemo(() => {
    const questionText = questionData.text || ""
    const correctAnswer = questionData.answer || ""

    // Check question type indicators
    if (questionText.toLowerCase().includes("briefly") || questionText.toLowerCase().includes("short")) {
      return "short"
    }
    if (questionText.toLowerCase().includes("detail") || questionText.toLowerCase().includes("explain") || questionText.toLowerCase().includes("discuss")) {
      return "long"
    }

    // Check answer length as indicator
    const answerWords = correctAnswer.split(/\s+/).filter((word: string) => word.length > 0)
    if (answerWords.length < 25) return "short"
    if (answerWords.length > 100) return "long"
    return "medium"
  }, [questionData.text, questionData.answer])

  // Use existing hints from question data, or generate additional ones if needed
  const hints = useMemo(() => {
    // If question already has hints, use them directly
    if (questionData.hints && questionData.hints.length > 0) {
      // Convert string hints to Hint objects expected by HintSystem
      return questionData.hints.map((hintText: string, index: number) => ({
        level: index < 2 ? "low" as const : index < 4 ? "medium" as const : "high" as const,
        type: "contextual" as const,
        content: hintText,
        spoilerLevel: index < 2 ? "low" as const : index < 4 ? "medium" as const : "high" as const,
        penalty: 0,
        description: `Hint ${index + 1}`,
        targetLength: expectedLength
      }))
    }

    // Fallback: generate hints if no existing hints
    const validKeywords = Array.isArray(questionData.keywords) ? questionData.keywords : []
    const validTags = Array.isArray(questionData.tags) ? questionData.tags : []
    
    return generateHints(
      answer,
      questionData.text || "",
      {
        tags: validTags,
        keywords: validKeywords,
        expectedLength
      },
      undefined, // No user answer for hint generation
      { 
        maxHints: 5, // Increased from 3 for open-ended questions
        allowDirectAnswer: false 
      }
    )
  }, [questionData.hints, questionData.keywords, questionData.text, questionData.tags, expectedLength, answer])

  // Build progressive contextual hints (1 -> high-level topic, 5 -> detailed guidance)
  // Replaced with a clearer 5-step hint template (user-provided) while preserving HintSystem's hint object shape.
  const progressiveHints = useMemo(() => {
    const base: any[] = Array.isArray(hints) ? [...hints] : []

    // Compute canonical answer stats (if available)
    const canonicalAnswer = (questionData.answer || "").toString().trim()
    const words = canonicalAnswer ? canonicalAnswer.split(/\s+/).filter(Boolean) : []
    const wordCount = words.length
    const charCount = canonicalAnswer.length
    const firstWord = words.length > 0 ? words[0] : ''
    const lastWord = words.length > 0 ? words[words.length - 1] : ''
    const firstChar = firstWord ? String(firstWord).charAt(0) : ''
    const lastChar = lastWord ? String(lastWord).slice(-1) : ''

    // Progressive hint contents (user-approved), enriched with stats where useful
    const hintContents = [
      `This describes OpenAI’s overarching mission: developing advanced AI in ways that are safe and beneficial for people and society. (Words: ${wordCount}, Chars: ${charCount})`,
      `Focus on these core words and phrases: safety, alignment, research, collaboration, accessibility, broad benefit, capability advancement.`,
      `Structure your answer in 2–3 short sentences: define the primary goal, list 3–4 concrete objectives (e.g., safe development, broad access, research collaboration, beneficial deployment), then tie them to how they advance AI.`,
      `The answer likely starts with "The" and should be about 100–110 words; use a formal explanatory tone. Anchors: starts with '${firstChar || '?'}', ends with '${lastChar || '?'}'.`,
      `Starter scaffold: "The primary goals of OpenAI are to develop advanced AI systems that are safe, broadly beneficial, and accessible to as many people as possible; to conduct and share research that advances understanding and alignment; and to collaborate with others to ensure AI’s benefits are distributed widely." Expand with a short sentence explaining how these goals contribute to AI (examples: improved capabilities, safer deployments, democratized access).`,
    ]

    // Convert to Hint objects and append while avoiding duplicates, cap at 5, and include meta stats
    const existingContents = new Set(base.map((b: any) => (b && b.content) ? b.content : String(b)))
    for (const [idx, content] of hintContents.entries()) {
      if (existingContents.size >= 5) break
      if (!existingContents.has(content)) {
        const level = idx < 2 ? 'low' : idx < 4 ? 'medium' : 'high'
        base.push({
          level,
          type: 'contextual',
          content,
          spoilerLevel: idx < 2 ? 'low' : idx < 4 ? 'medium' : 'high',
          penalty: 0,
          description: `Hint ${idx + 1}`,
          targetLength: expectedLength,
          meta: {
            wordCount,
            charCount,
            firstChar,
            lastChar,
            suggestedStart: firstWord || null,
          },
        })
        existingContents.add(content)
      }
    }

    return base.slice(0, 5)
  }, [hints, expectedLength, questionData.answer])

  // Calculate similarity and keyword coverage when answer changes
  useEffect(() => {
    if (answer.trim()) {
      if (questionData.answer) {
        const result = calculateAnswerSimilarity(answer, questionData.answer, 0.5)
        console.log('[OpenEndedQuiz] Similarity calculated:', {
          userAnswerLength: answer.length,
          correctAnswerLength: questionData.answer.length,
          similarity: result.similarity,
          isAcceptable: result.isAcceptable,
          threshold: 0.5
        })
        setSimilarity(result.similarity)
        setIsAnswered(result.isAcceptable)
      }
      // Check keyword coverage
      if (questionData.keywords.length > 0) {
        const covered = questionData.keywords.filter((keyword: string) => answer.toLowerCase().includes(keyword.toLowerCase()))
        setKeywordsCovered(covered)
      }
    } else {
      setSimilarity(0)
      setIsAnswered(false)
      setKeywordsCovered([])
    }
  }, [answer, questionData.answer, questionData.keywords])

  // Track question changes and reset state only when question changes
  const questionIdRef = useRef(question?.id)
  useEffect(() => {
    if (questionIdRef.current !== question?.id) {
      questionIdRef.current = question?.id
      setAnswer(existingAnswer || '')
      setIsAnswered(!!existingAnswer)
      setShowValidation(false)
      setHintsUsed(0)
      setSimilarity(0)
      setKeywordsCovered([])
    }
  }, [question?.id, existingAnswer])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
  }, [])

  const handleInputBlur = useCallback(() => {
    setIsFocused(false)
    if (pendingResetRef.current) {
      pendingResetRef.current = false
      const expected = pendingResetValueRef.current
      pendingResetValueRef.current = null
      if (expected === answer) {
        setAnswer('')
        setIsAnswered(false)
        setShowValidation(false)
        setKeywordsCovered([])
      }
    }
  }, [])

  const handleInputFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    // Allow submission if similarity is good (similarity calculation already validated answer quality)
    if (similarity < 0.5) {
      console.log('[OpenEndedQuiz] Similarity too low - cannot submit:', similarity)
      setShowValidation(true)
      return false
    }
    
    console.log('[OpenEndedQuiz] Submitting answer:', { 
      answerLength: answer.length, 
      similarity, 
      hintsUsed, 
      canProceed: similarity >= 0.5 
    })
    const result = onAnswer(answer, similarity, hintsUsed)
    console.log('[OpenEndedQuiz] onAnswer returned:', result)
    // Treat undefined as success to avoid blocking navigation when handlers don't return a boolean
    if (typeof result === 'undefined') return true
    return Boolean(result)
  }, [answer, similarity, hintsUsed, onAnswer])

  const handleNext = useCallback(() => {
    console.log('[OpenEndedQuiz] handleNext called')
    const submitResult = handleAnswerSubmit()
    console.log('[OpenEndedQuiz] handleAnswerSubmit result:', submitResult)
    
    if (submitResult && onNext) {
      console.log('[OpenEndedQuiz] Moving to next question - resetting state')
      // Reset hints immediately when answer is successfully submitted
      setHintsUsed(0)
      setAnswer('')  // Clear answer immediately
      setSimilarity(0)  // Reset similarity immediately
      setIsAnswered(false)
      setShowValidation(false)
      setKeywordsCovered([])
      
      onNext()

      // Return a cleanup function to reset answer state when moving to the next question
      return () => {
        // Additional cleanup if needed
      }
    } else {
      console.log('[OpenEndedQuiz] Cannot proceed - submitResult:', submitResult, 'onNext:', !!onNext)
    }
    return undefined
  }, [handleAnswerSubmit, onNext])

  const handleSubmit = useCallback(() => {
    if (handleAnswerSubmit() && onSubmit) {
      onSubmit()
    }
  }, [handleAnswerSubmit, onSubmit])

  const handleHintUsed = useCallback((hintLevel: number) => {
    if (hintLevel > 0) {
      setHintsUsed((prev) => prev + 1)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        if (isLastQuestion) {
          handleSubmit()
        } else {
          handleNext()
        }
      }
    },
    [isLastQuestion, handleSubmit, handleNext],
  )

  const minLength = 5
  // User can proceed if similarity is good (similarity calculation already validates answer quality)
  const canProceed = similarity >= 0.5
  
  // Debug logging for canProceed
  useEffect(() => {
    console.log('[OpenEndedQuiz] canProceed updated:', {
      answerLength: answer.trim().length,
      minLength,
      similarity,
      canProceed,
      threshold: 0.5
    })
  }, [answer, similarity, canProceed, minLength])
  const wordCount = answer
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return (
    <div className="w-full h-full flex flex-col">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full h-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 flex-1 overflow-y-auto"
      >
        <div className="w-full h-full space-y-6 sm:space-y-8 pb-24">
          {/* Question Display */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full"
          >
            <Card className="w-full h-full border-0 shadow-lg bg-white dark:bg-gray-900">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1"></div>
              <CardContent className="w-full h-full p-6 sm:p-8">
                <div className="w-full space-y-6">
                  {/* Header Section */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground">Open-Ended Question</h3>
                      {hintsUsed > 0 && (
                        <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-300">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="w-full text-center">
                    <p className="text-lg leading-relaxed text-foreground break-words max-w-4xl mx-auto">
                      {questionData.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Answer Input */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-4"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="answer" className="text-sm font-medium text-foreground flex items-center gap-1">
                Your Answer
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm p-2">
                      Provide a comprehensive answer with clear explanations and relevant examples.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
            </div>
            <Textarea
              id="answer"
              value={answer}
              onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
              placeholder="Share your understanding and reasoning..."
              className={cn(
                "w-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] resize-y transition-all border-2 bg-background text-sm sm:text-base md:text-lg",
                "focus:outline-none focus:ring-0 p-4 sm:p-6 rounded-lg", // Larger padding on mobile
                "min-h-[3rem]", // Ensure minimum touch target when focused
                isAnswered
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                  : showValidation
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                    : "border-gray-300 hover:border-violet-400 focus:border-violet-500 focus:shadow-violet-200/30",
              )}
              inputMode="text" // Better mobile keyboard
              autoCapitalize="sentences"
              autoComplete="off"
              autoFocus
              aria-label="Enter your detailed answer"
            />
            {showValidation && answer.trim().length < minLength && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm text-red-600 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-center">
                  Please provide at least {minLength} characters for a meaningful answer
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Success indicator */}
          {answer.trim() && similarity >= 0.5 && (
            <div className="flex items-center justify-center pt-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Good response!</span>
              </div>
            </div>
          )}

          {/* Adaptive Feedback Wrapper - Intelligent feedback based on attempts */}
          {answer.trim() && similarity < 0.5 && (
            <AdaptiveFeedbackWrapper
              quizSlug={slug || 'unknown-quiz'}
              questionId={question.id}
              userAnswer={answer}
              correctAnswer={questionData.answer}
              isAuthenticated={isAuthenticated}
              hints={hints.map((h: any) => (h && h.content) ? h.content : String(h))}
              relatedTopicSlug={slug}
              difficulty={3}
              shouldShowFeedback={true}
              onReset={() => {
                // If user is actively typing, defer the reset until blur to avoid erasing in-progress input
                if (isFocused) {
                  pendingResetValueRef.current = answer
                  pendingResetRef.current = true
                } else {
                  setAnswer('')
                  setIsAnswered(false)
                  setShowValidation(false)
                  setKeywordsCovered([])
                }
              }}
            />
          )}

          {/* Hint System */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <HintSystem
              hints={progressiveHints || []}
              onHintUsed={(hintIndex, hint) => handleHintUsed(hintIndex + 1)}
              questionText={questionData.text}
              userInput={answer}
              correctAnswer={questionData.answer}
              maxHints={5} // Increased from 3 for open-ended questions
              expectedLength={expectedLength}
              tags={questionData.tags}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Footer - Sticky at bottom */}
      <motion.div
        variants={itemVariants}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full flex-shrink-0"
      >
        <QuizFooter
          onNext={(() => {
            console.log('[OpenEndedQuiz] Next button config:', { canProceed, minLength: 5, answerLength: answer.length, similarity, willEnable: canProceed })
            const stateManager = useOptionalQuizState()
            if (stateManager) {
              return () => stateManager.handleNext(handleNext)
            }
            return () => {
              const result = handleNext()
              // If handleNext returned a cleanup function, call it immediately here for non-provider case
              if (typeof result === 'function') result()
            }
          })()}
          onPrevious={onPrevious}
          onSubmit={handleSubmit}
          canGoNext={canProceed}
          canGoPrevious={canGoPrevious}
          isLastQuestion={isLastQuestion}
          hasAnswer={canProceed}
        />
      </motion.div>
    </div>
  )
}
