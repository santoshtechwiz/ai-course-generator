"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Target, BookOpen, Lightbulb, Trophy, Focus, Brain } from 'lucide-react'
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { calculateAnswerSimilarity, getSimilarityLabel, getSimilarityFeedback } from "@/lib/utils/text-similarity"
import { generateBlanksHints } from "@/lib/utils/hint-system"
import type { BlankQuizQuestion } from "@/app/types/quiz-types"

interface BlanksQuizProps {
  question: BlankQuizQuestion
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
}

// Enhanced animation variants with smoother transitions
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.7,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      duration: 0.4,
      ease: "easeIn",
    },
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

const feedbackVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: { duration: 0.3 },
  },
}

const inputFocusVariants = {
  focused: {
    scale: 1.02,
    boxShadow: "0 0 0 4px rgba(6, 182, 212, 0.15)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  unfocused: {
    scale: 1,
    boxShadow: "0 0 0 0px rgba(6, 182, 212, 0)",
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

export default function BlanksQuiz({
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
}: BlanksQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [typingTime, setTypingTime] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const openEndedData = question || {}
    return {
      text: question.question,
      answer: question.answer,
      hints: question.hints,
      difficulty: question.difficulty || "Medium",
      tags: question.tags || [],
    }
  }, [question])

  // Generate comprehensive hints for this question
  const hints = useMemo(() => {
    return generateBlanksHints(questionData.answer, questionData.text, questionData.hints)
  }, [questionData.answer, questionData.text, questionData.hints])

  // Parse question parts for blank display
  const questionParts = useMemo(() => {
    const blankMarker = "________"
    const parts = questionData.text.split(blankMarker)
    return {
      before: parts[0] || "",
      after: parts[1] || "",
      hasBlank: questionData.text.includes(blankMarker),
    }
  }, [questionData.text])

  // Typing time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (answer.length > 0 && isFocused) {
      interval = setInterval(() => {
        setTypingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [answer, isFocused])

  // Calculate similarity when answer changes
  useEffect(() => {
    if (answer.trim() && questionData.answer) {
      const result = calculateAnswerSimilarity(answer, questionData.answer, 0.7)
      setSimilarity(result.similarity)
      const wasAnswered = isAnswered
      setIsAnswered(result.isAcceptable)
      
      // Show celebration for first correct answer
      if (!wasAnswered && result.isAcceptable && result.similarity >= 0.8) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 2000)
      }
    } else {
      setSimilarity(0)
      setIsAnswered(false)
    }
  }, [answer, questionData.answer, isAnswered])

  // Update answer from props
  useEffect(() => {
    if (existingAnswer && existingAnswer !== answer) {
      setAnswer(existingAnswer)
    }
  }, [existingAnswer, answer])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    if (!answer.trim()) {
      setShowValidation(true)
      return false
    }
    return onAnswer(answer, similarity, hintsUsed)
  }, [answer, similarity, hintsUsed, onAnswer])

  const handleNext = useCallback(() => {
    if (handleAnswerSubmit() && onNext) {
      onNext()
    }
  }, [handleAnswerSubmit, onNext])

  const handleSubmit = useCallback(() => {
    if (handleAnswerSubmit() && onSubmit) {
      onSubmit()
    }
  }, [handleAnswerSubmit, onSubmit])

  const handleHintUsed = useCallback((hintIndex: number) => {
    setHintsUsed((prev) => Math.max(prev, hintIndex + 1))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
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

  // Enhanced feedback based on similarity
  const feedback = useMemo(() => {
    if (!answer.trim()) return null
    const label = getSimilarityLabel(similarity)
    const message = getSimilarityFeedback(similarity)
    let color = "text-gray-600"
    let bgColor = "bg-gray-50 dark:bg-gray-950/20"
    let borderColor = "border-gray-200 dark:border-gray-800"
    let icon = Target
    let level = "Getting Started"
    let emoji = "🎯"
    let celebration = ""

    if (similarity >= 0.9) {
      color = "text-emerald-600"
      bgColor = "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20"
      borderColor = "border-emerald-200 dark:border-emerald-800"
      icon = Trophy
      level = "Perfect Match!"
      emoji = "🏆"
      celebration = "🎉✨🌟"
    } else if (similarity >= 0.8) {
      color = "text-cyan-600"
      bgColor = "bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20"
      borderColor = "border-cyan-200 dark:border-cyan-800"
      icon = CheckCircle
      level = "Excellent!"
      emoji = "✅"
      celebration = "🎊👏"
    } else if (similarity >= 0.65) {
      color = "text-green-600"
      bgColor = "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
      borderColor = "border-green-200 dark:border-green-800"
      icon = CheckCircle
      level = "Good Match!"
      emoji = "👍"
      celebration = "💪📚"
    } else if (similarity >= 0.4) {
      color = "text-yellow-600"
      bgColor = "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
      borderColor = "border-yellow-200 dark:border-yellow-800"
      icon = AlertCircle
      level = "Close!"
      emoji = "⚡"
      celebration = "🌱💡"
    } else {
      color = "text-red-600"
      bgColor = "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
      borderColor = "border-red-200 dark:border-red-800"
      icon = AlertCircle
      level = "Try Again!"
      emoji = "🤔"
      celebration = "💪🔥"
    }
    return { label, message, color, bgColor, borderColor, icon, level, emoji, celebration }
  }, [answer, similarity])

  const canProceed = Boolean(answer.trim() && similarity >= 0.6)  // Reduced from 0.7 to 0.6 for better UX
  const minimumSimilarityThreshold = 0.7

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
      <QuizContainer animationKey={String(question.id)}>
        <div className="space-y-6 sm:space-y-8">
       

          {/* Enhanced Question Display with better responsive design */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2"></div>
              <CardContent className="p-6 md:p-10">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-8">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Complete the Statement</h3>
                      <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"></div>
                    </div>
                    
                    {/* Enhanced Question Display with better mobile experience */}
                    <div className="text-lg md:text-xl lg:text-2xl font-medium leading-relaxed">
                      {questionParts.hasBlank ? (
                        <div className="flex flex-col items-center gap-6 text-center">
                          <div className="max-w-4xl">
                            <span className="text-foreground break-words block mb-4">{questionParts.before}</span>
                            
                            <motion.div
                              variants={inputFocusVariants}
                              animate={isFocused ? "focused" : "unfocused"}
                              className="relative inline-block w-full max-w-md mx-4"
                            >
                              <Input
                                value={answer}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Your answer here"
                                className={cn(
                                  "text-center font-semibold border-3 border-dashed rounded-2xl transition-all duration-300 text-lg md:text-xl py-4 px-6",
                                  "min-h-[60px] shadow-lg",
                                  isAnswered
                                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-emerald-200/50"
                                    : showValidation
                                      ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 animate-pulse"
                                      : "border-cyan-300 hover:border-cyan-400 focus:border-cyan-500 focus:shadow-cyan-200/50 bg-gray-50 dark:bg-gray-800",
                                )}
                                autoFocus
                                aria-label="Fill in the blank"
                              />
                              
                              {/* Success indicator */}
                              {isAnswered && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <CheckCircle className="w-6 h-6 text-white" />
                                </motion.div>
                              )}
                              
                              {/* Celebration effect */}
                              <AnimatePresence>
                                {showCelebration && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl"
                                  >
                                    🎉
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            
                            <span className="text-foreground break-words block mt-4">{questionParts.after}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8 text-center">
                          <p className="text-foreground break-words px-4 leading-relaxed max-w-4xl mx-auto">
                            {questionData.text}
                          </p>
                          <motion.div
                            variants={inputFocusVariants}
                            animate={isFocused ? "focused" : "unfocused"}
                            className="relative max-w-lg mx-auto"
                          >
                            <Input
                              value={answer}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              placeholder="Enter your answer here"
                              className={cn(
                                "text-center font-semibold border-3 border-dashed rounded-2xl transition-all duration-300 text-lg md:text-xl py-4 px-6",
                                "min-h-[60px] shadow-lg w-full",
                                isAnswered
                                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-emerald-200/50"
                                  : showValidation
                                    ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 animate-pulse"
                                    : "border-cyan-300 hover:border-cyan-400 focus:border-cyan-500 focus:shadow-cyan-200/50 bg-gray-50 dark:bg-gray-800",
                              )}
                              autoFocus
                              aria-label="Enter your answer"
                            />
                            
                            {isAnswered && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                              >
                                <CheckCircle className="w-6 h-6 text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                      )}
                    </div>
                    
                    {/* Simple Success Indicator */}
                    {answer.trim() && similarity >= 0.6 && (
                      <div className="flex items-center justify-center pt-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Good answer!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Enhanced Validation Error */}
            {showValidation && !answer.trim() && (
              <motion.div
                variants={feedbackVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center justify-center gap-3 text-sm text-red-600 mt-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-800 shadow-lg"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-5 h-5 animate-bounce flex-shrink-0" />
                <span className="font-semibold">Please enter an answer before continuing</span>
              </motion.div>
            )}
          </motion.div>

          {/* Removed detailed feedback to prevent answer revelation and save space */}

          {/* Enhanced Hint System */}
          <motion.div variants={itemVariants}>
            <HintSystem
              hints={hints}
              onHintUsed={handleHintUsed}
              userInput={answer}
              questionText={questionData.text}
              maxHints={3}
            />
          </motion.div>

          {/* Enhanced Footer */}
          <motion.div variants={itemVariants}>
            <QuizFooter
              onNext={handleNext}
              onPrevious={onPrevious}
              onSubmit={handleSubmit}
              canGoNext={canProceed}
              canGoPrevious={canGoPrevious}
              isLastQuestion={isLastQuestion}
              nextLabel="Next Question"
              submitLabel="Finish Quiz"
            />
          </motion.div>
        </div>
      </QuizContainer>
    </motion.div>
  )
}
