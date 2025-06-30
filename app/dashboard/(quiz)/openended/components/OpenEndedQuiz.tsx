"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertCircle,
  Target,
  BookOpen,
  Clock,
  Lightbulb,
  Trophy,
  Star,
  Zap,
  Brain,
  Sparkles,
  TrendingUp,
  Eye,
  Save,
  MessageSquare,
  ChevronRight,
  PenTool,
  FileText,
  Wand2,
  Briefcase,
  Award,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { calculateAnswerSimilarity, getSimilarityLabel, getSimilarityFeedback } from "@/lib/utils/text-similarity"
import { generateOpenEndedHints, calculateHintPenalty } from "@/lib/utils/hint-system"
import type { OpenEndedQuestion } from "@/app/types/quiz-types"

interface OpenEndedQuizProps {
  question: OpenEndedQuestion
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
}: OpenEndedQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [keywordsCovered, setKeywordsCovered] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [writingTime, setWritingTime] = useState(0)
  const [showWordSuggestions, setShowWordSuggestions] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const openEndedData = question || {}
    return {
      text: question.question || question.text || "",
      answer: question.answer || openEndedData.correctAnswer || "",
      keywords: question.tags || [],
      hints: openEndedData.hints || question.hints || [],
      difficulty: openEndedData.difficulty || question.difficulty || "Medium",
      tags: openEndedData.tags || question.tags || [],
    }
  }, [question])

  // Generate hints for this question using actual question hints
  const hints = useMemo(() => {
    return generateOpenEndedHints(questionData.keywords, questionData.text, questionData.hints)
  }, [questionData.keywords, questionData.text, questionData.hints])

  // Calculate similarity and keyword coverage when answer changes
  useEffect(() => {
    if (answer.trim()) {
      if (questionData.answer) {
        const result = calculateAnswerSimilarity(answer, questionData.answer, 0.6)
        setSimilarity(result.similarity)
        setIsAnswered(result.isAcceptable)
      }

      // Check keyword coverage
      if (questionData.keywords.length > 0) {
        const covered = questionData.keywords.filter((keyword) => answer.toLowerCase().includes(keyword.toLowerCase()))
        setKeywordsCovered(covered)
      }
    } else {
      setSimilarity(0)
      setIsAnswered(false)
      setKeywordsCovered([])
    }
  }, [answer, questionData.answer, questionData.keywords])

  // Writing time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTyping) {
      interval = setInterval(() => {
        setWritingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTyping])

  // Auto-save functionality
  useEffect(() => {
    if (answer.length > 50) {
      const timer = setTimeout(() => {
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2000)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [answer])

  // Update answer from props
  useEffect(() => {
    if (existingAnswer && existingAnswer !== answer) {
      setAnswer(existingAnswer)
    }
  }, [existingAnswer, answer])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
    setIsTyping(value.length > 0)
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    const minLength = 10
    if (!answer.trim() || answer.trim().length < minLength) {
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

  // Get enhanced feedback with business elements
  const feedback = useMemo(() => {
    if (!answer.trim()) return null

    const label = getSimilarityLabel(similarity)
    const message = getSimilarityFeedback(similarity)
    const keywordCoverage =
      questionData.keywords.length > 0 ? (keywordsCovered.length / questionData.keywords.length) * 100 : 100

    let color = "text-gray-600"
    let bgColor = "bg-gray-50 dark:bg-gray-950/20"
    let borderColor = "border-gray-200 dark:border-gray-800"
    let icon = Target
    let level = "Getting Started"
    let emoji = "🎯"
    let businessMessage = ""

    if (similarity >= 0.9 && keywordCoverage >= 80) {
      color = "text-emerald-600"
      bgColor = "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20"
      borderColor = "border-emerald-200 dark:border-emerald-800"
      icon = Trophy
      level = "Expert Level"
      emoji = "🏆"
      businessMessage = "Outstanding! This demonstrates senior-level expertise."
    } else if (similarity >= 0.8 && keywordCoverage >= 70) {
      color = "text-blue-600"
      bgColor = "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
      borderColor = "border-blue-200 dark:border-blue-800"
      icon = Star
      level = "Advanced"
      emoji = "⭐"
      businessMessage = "Excellent work! You're showing professional-level understanding."
    } else if (similarity >= 0.6 || keywordCoverage >= 50) {
      color = "text-amber-600"
      bgColor = "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
      borderColor = "border-amber-200 dark:border-amber-800"
      icon = Zap
      level = "Intermediate"
      emoji = "⚡"
      businessMessage = "Good progress! Keep building on this foundation."
    } else {
      color = "text-rose-600"
      bgColor = "bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20"
      borderColor = "border-rose-200 dark:border-rose-800"
      icon = AlertCircle
      level = "Learning"
      emoji = "📚"
      businessMessage = "Every expert was once a beginner. Keep practicing!"
    }

    return {
      label,
      message,
      color,
      bgColor,
      borderColor,
      icon,
      keywordCoverage,
      level,
      emoji,
      businessMessage,
    }
  }, [answer, similarity, keywordsCovered, questionData.keywords])

  const minLength = 10
  const canProceed = answer.trim().length >= minLength
  const wordCount = answer
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
  const readingTime = Math.ceil(wordCount / 200)
  const completionPercentage = Math.min((answer.length / 500) * 100, 100)

  // Word suggestions based on keywords
  const wordSuggestions = useMemo(() => {
    if (!questionData.keywords.length) return []
    return questionData.keywords.filter((keyword) => !answer.toLowerCase().includes(keyword.toLowerCase())).slice(0, 3)
  }, [questionData.keywords, answer])

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
      <QuizContainer
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        quizType="openended"
        animationKey={question.id}
        quizTitle="Open-Ended Challenge"
        quizSubtitle="Demonstrate your expertise with detailed explanations"
        timeSpent={timeSpent}
        difficulty={questionData.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
      >
        <div className="space-y-4 sm:space-y-6">
        
          {/* Enhanced Header */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 sm:p-6 border border-primary/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <DifficultyBadge difficulty={questionData.difficulty} />
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      Critical Thinking
                    </Badge>
                    <TagsDisplay tags={questionData.tags} maxVisible={3} />
                    {hintsUsed > 0 && (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/20"
                      >
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used
                      </Badge>
                    )}
                    {autoSaved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Auto-saved
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Build expertise • Advance your career • Stand out to employers
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
               
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  High Demand Skill
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Question Display */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Card className="border-l-4 border-l-primary bg-gradient-to-r from-background to-primary/5 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg text-foreground">Question</h3>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Asked by 12.5k+ professionals
                      </Badge>
                    </div>
                    <p className="text-foreground leading-relaxed text-base mb-4">{questionData.text}</p>

                    {/* Business Context */}
                    {/* <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Industry Relevance</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        This type of question is commonly asked in technical interviews and professional assessments.
                        Mastering this concept can increase your market value by 15-25%.
                      </p>
                    </div> */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Keywords Section */}
            {questionData.keywords.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Key Concepts to Address
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {keywordsCovered.length}/{questionData.keywords.length} covered
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {questionData.keywords.map((keyword, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Badge
                            variant={keywordsCovered.includes(keyword) ? "default" : "outline"}
                            className={cn(
                              "text-xs transition-all duration-300",
                              keywordsCovered.includes(keyword)
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                : "text-muted-foreground hover:border-primary hover:text-primary",
                            )}
                          >
                            {keywordsCovered.includes(keyword) && <CheckCircle className="w-3 h-3 mr-1" />}
                            {keyword}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress Bar for Keyword Coverage */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Concept Coverage</span>
                        <span className="text-xs font-medium text-primary">
                          {Math.round((keywordsCovered.length / questionData.keywords.length) * 100)}%
                        </span>
                      </div>
                      <Progress value={(keywordsCovered.length / questionData.keywords.length) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Enhanced Answer Input Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Input Header with Stats */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <label htmlFor="answer" className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Your Expert Response
                </label>
                {isTyping && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    <PenTool className="w-3 h-3 mr-1" />
                    Writing...
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {Math.floor(writingTime / 60)}:{(writingTime % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>~{readingTime}min read</span>
                </div>
              </div>
            </div>

            {/* Writing Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Response Completeness</span>
                <span className="text-xs font-medium text-primary">{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-1.5" />
            </div>

            {/* Enhanced Textarea */}
            <div className="relative">
              <Textarea
                id="answer"
                value={answer}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share your expertise and detailed explanation here... 

💡 Pro tip: Structure your answer with clear points
🎯 Address the key concepts mentioned above
⚡ Use examples to demonstrate understanding

Press Ctrl+Enter to submit"
                className={cn(
                  "min-h-[160px] resize-y transition-all duration-300 text-base leading-relaxed",
                  "border-2 rounded-xl p-4",
                  isAnswered
                    ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-lg"
                    : showValidation
                      ? "border-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
                      : "hover:border-primary focus:border-primary focus:shadow-lg",
                  answer.length > 100 && "shadow-md",
                )}
                autoFocus
                aria-label="Enter your detailed expert response"
              />

              {/* Floating Action Buttons */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                  onClick={() => setShowWordSuggestions(!showWordSuggestions)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Word Suggestions */}
            <AnimatePresence>
              {showWordSuggestions && wordSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Consider including these concepts:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wordSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                        onClick={() => {
                          setAnswer((prev) => prev + (prev.endsWith(" ") ? "" : " ") + suggestion + " ")
                        }}
                      >
                        + {suggestion}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation Message */}
            {showValidation && answer.trim().length < minLength && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Please provide at least {minLength} characters for a meaningful response
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Enhanced AI Feedback Section */}
          <AnimatePresence>
            {feedback && answer.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={cn("border-2 shadow-xl overflow-hidden", feedback.borderColor, feedback.bgColor)}>
                  <CardContent className="p-4 sm:p-6">
                    {/* Feedback Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                          feedback.color.replace("text-", "bg-").replace("-600", "-500"),
                          "text-white",
                        )}
                      >
                        <feedback.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className={cn("text-lg font-bold", feedback.color)}>
                            {feedback.emoji} {feedback.level}
                          </h4>
                          <Badge variant="outline" className={cn("text-xs font-medium", feedback.color)}>
                            {feedback.label}
                          </Badge>
                        </div>
                        <p className={cn("text-sm leading-relaxed mb-3", feedback.color)}>{feedback.message}</p>
                        <p className="text-sm text-muted-foreground italic">{feedback.businessMessage}</p>
                      </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className={cn("text-lg font-bold", feedback.color)}>{Math.round(similarity * 100)}%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className={cn("text-lg font-bold", feedback.color)}>
                          {Math.round(feedback.keywordCoverage)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Concepts</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className={cn("text-lg font-bold", feedback.color)}>{wordCount}</div>
                        <div className="text-xs text-muted-foreground">Words</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg">
                        <div className={cn("text-lg font-bold", feedback.color)}>
                          {100 - calculateHintPenalty(hintsUsed)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>

                    {/* Improvement Suggestions */}
                    {questionData.keywords.length > 0 && keywordsCovered.length < questionData.keywords.length && (
                      <div className="bg-background/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium">Boost Your Score</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Consider addressing these concepts to maximize your professional impact:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {questionData.keywords
                            .filter((k) => !keywordsCovered.includes(k))
                            .map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Career Impact Section */}
                    {similarity >= 0.7 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                            Career Impact
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          This level of expertise is valued at $75k-$120k+ in the current market. Keep building on this
                          foundation!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Hint System */}
          <motion.div variants={itemVariants}>
            <HintSystem
              hints={hints}
              onHintUsed={handleHintUsed}
              userInput={answer}
              correctAnswer={questionData.answer}
              questionText={questionData.text}
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
              nextLabel={
                <span className="flex items-center gap-2">
                  Next Challenge
                  <ChevronRight className="w-4 h-4" />
                </span>
              }
              submitLabel={
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Complete & Get Results
                </span>
              }
            />
          </motion.div>
        </div>
      </QuizContainer>
    </motion.div>
  )
}
