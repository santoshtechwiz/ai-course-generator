"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertCircle,
  Target,
  Zap,
  BookOpen,
  Lightbulb,
  Trophy,
  Brain,
  Users,
  Clock,
  BarChart3,
  PenTool,
  Eye,
  Focus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { calculateAnswerSimilarity, getSimilarityLabel, getSimilarityFeedback } from "@/lib/utils/text-similarity"
import { generateBlanksHints } from "@/lib/utils/hint-system"
import type { BlankQuestion } from "./types"

interface BlanksQuizProps {
  question: BlankQuestion
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

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const feedbackVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: { duration: 0.2 },
  },
}

const inputFocusVariants = {
  focused: {
    scale: 1.02,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 },
  },
  unfocused: {
    scale: 1,
    boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)",
    transition: { duration: 0.2 },
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

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const openEndedData = question.openEndedQuestion || {}
    return {
      text: question.question,
      answer: question.answer,
      hints: openEndedData.hints,
      difficulty: openEndedData.difficulty || "Medium",
      tags: openEndedData.tags || [],
    }
  }, [question])

  // Generate comprehensive hints for this question (5 hints)
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
    if (answer.length > 0) {
      interval = setInterval(() => {
        setTypingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [answer])

  // Calculate similarity when answer changes
  useEffect(() => {
    if (answer.trim() && questionData.answer) {
      const result = calculateAnswerSimilarity(answer, questionData.answer, 0.7)
      setSimilarity(result.similarity)
      setIsAnswered(result.isAcceptable)
    } else {
      setSimilarity(0)
      setIsAnswered(false)
    }
  }, [answer, questionData.answer])

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

  // Get feedback based on similarity
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

    if (similarity >= 0.9) {
      color = "text-emerald-600"
      bgColor = "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20"
      borderColor = "border-emerald-200 dark:border-emerald-800"
      icon = Trophy
      level = "Perfect Match"
      emoji = "🏆"
    } else if (similarity >= 0.8) {
      color = "text-blue-600"
      bgColor = "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
      borderColor = "border-blue-200 dark:border-blue-800"
      icon = CheckCircle
      level = "Excellent"
      emoji = "✅"
    } else if (similarity >= 0.65) {
      color = "text-green-600"
      bgColor = "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
      borderColor = "border-green-200 dark:border-green-800"
      icon = CheckCircle
      level = "Good Match"
      emoji = "👍"
    } else if (similarity >= 0.4) {
      color = "text-yellow-600"
      bgColor = "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
      borderColor = "border-yellow-200 dark:border-yellow-800"
      icon = AlertCircle
      level = "Close"
      emoji = "⚡"
    } else {
      color = "text-red-600"
      bgColor = "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
      borderColor = "border-red-200 dark:border-red-800"
      icon = AlertCircle
      level = "Try Again"
      emoji = "🎯"
    }

    return { label, message, color, bgColor, borderColor, icon, level, emoji }
  }, [answer, similarity])

  const canProceed = answer.trim() && similarity >= 0.7
  const minimumSimilarityThreshold = 0.7

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
      <QuizContainer
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        quizType="blanks"
        animationKey={question.id}
        quizTitle="Fill in the Blank"
        quizSubtitle="Complete the sentence with the correct word or phrase"
        timeSpent={timeSpent}
        difficulty={questionData.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Clean Header - No Streaks */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-2xl p-4 sm:p-6 border border-blue-200/50 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-700/50"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Focus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <DifficultyBadge difficulty={questionData.difficulty} />
                      <TagsDisplay tags={questionData.tags} maxVisible={3} />
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      Precision Learning
                    </Badge>
                  
                    {hintsUsed > 0 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Focus on accuracy • Learn step by step • Master key concepts
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
               
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Knowledge Check
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Question Display */}
          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-background to-blue-50/30 shadow-lg dark:to-blue-950/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-lg text-foreground">Complete the Statement</h3>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Learning focused
                      </Badge>
                    </div>

                    {/* Question with Blank Input */}
                    <div className="text-lg sm:text-xl font-medium leading-relaxed mb-4">
                      {questionParts.hasBlank ? (
                        <div className="flex flex-wrap items-center gap-2 text-center justify-center">
                          <span className="text-foreground">{questionParts.before}</span>
                          <motion.div
                            variants={inputFocusVariants}
                            animate={isFocused ? "focused" : "unfocused"}
                            className="relative inline-block"
                          >
                            <Input
                              value={answer}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              placeholder="Your answer"
                              className={cn(
                                "inline-block mx-2 px-4 py-2 text-center font-medium min-w-[180px] sm:min-w-[200px] border-2 border-dashed transition-all duration-300",
                                isAnswered
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 shadow-green-200/50 shadow-lg"
                                  : showValidation
                                    ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 animate-pulse"
                                    : "border-blue-300 hover:border-blue-500 focus:border-blue-500 focus:shadow-blue-200/50 focus:shadow-lg",
                              )}
                              autoFocus
                              aria-label="Fill in the blank"
                            />
                            {isAnswered && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                          <span className="text-foreground">{questionParts.after}</span>
                        </div>
                      ) : (
                        <div className="space-y-4 text-center">
                          <p className="text-foreground">{questionData.text}</p>
                          <motion.div
                            variants={inputFocusVariants}
                            animate={isFocused ? "focused" : "unfocused"}
                            className="relative max-w-md mx-auto"
                          >
                            <Input
                              value={answer}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              placeholder="Your answer"
                              className={cn(
                                "px-4 py-3 text-center font-medium border-2 transition-all duration-300 text-base",
                                isAnswered
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 shadow-green-200/50 shadow-lg"
                                  : showValidation
                                    ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 animate-pulse"
                                    : "border-blue-300 hover:border-blue-500 focus:border-blue-500 focus:shadow-blue-200/50 focus:shadow-lg",
                              )}
                              autoFocus
                              aria-label="Enter your answer"
                            />
                            {isAnswered && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {/* Learning Tips */}
                    {/* <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PenTool className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Learning Tip</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Take your time to think through the answer. Use the hints below if you need guidance - they're
                        designed to help you learn step by step.
                      </p>
                    </div> */}

                    {/* Stats */}
                    {answer.trim() && (
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {Math.floor(typingTime / 60)}:{(typingTime % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{answer.length} chars</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {showValidation && !answer.trim() && (
              <motion.div
                variants={feedbackVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center justify-center gap-2 text-sm text-red-600 mt-2"
              >
                <AlertCircle className="w-4 h-4 animate-bounce" />
                <span className="font-medium">Please enter an answer before continuing</span>
              </motion.div>
            )}
          </motion.div>

          {/* Answer Feedback */}
          <AnimatePresence mode="wait">
            {feedback && answer.trim() && (
              <motion.div variants={feedbackVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card className={cn("border-2 shadow-lg", feedback.borderColor, feedback.bgColor)}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                          feedback.color.replace("text-", "bg-").replace("-600", "-500"),
                          "text-white",
                        )}
                      >
                        <feedback.icon className="w-6 h-6" />
                      </motion.div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn("text-lg font-bold", feedback.color)}>
                            {feedback.emoji} {feedback.level}
                          </h4>
                          <Badge variant="outline" className={cn("text-xs font-medium", feedback.color)}>
                            {feedback.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            {Math.round(similarity * 100)}% match
                          </Badge>
                          {similarity < minimumSimilarityThreshold && (
                            <Badge variant="outline" className="text-xs text-blue-600 animate-pulse">
                              Need {Math.round(minimumSimilarityThreshold * 100)}%+ to proceed
                            </Badge>
                          )}
                        </div>
                        <motion.p
                          className={cn("text-sm leading-relaxed", feedback.color)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {feedback.message}
                        </motion.p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Answer Accuracy</span>
                            <span className="text-xs font-medium text-primary">{Math.round(similarity * 100)}%</span>
                          </div>
                          <Progress value={similarity * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Hint System - 5 Progressive Hints */}
          <motion.div variants={itemVariants}>
            <HintSystem
              hints={hints}
              onHintUsed={handleHintUsed}
              userInput={answer}
              correctAnswer={questionData.answer}
              questionText={questionData.text}
              maxHints={5}
            />
          </motion.div>

          {/* Footer */}
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
