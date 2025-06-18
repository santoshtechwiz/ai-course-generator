"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Home, CheckCircle2, XCircle, Circle, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizResultLayoutProps {
  title: string
  subtitle?: string
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  timeTaken?: string
  questions: Array<{
    id: string
    question: string
    type: string
    userAnswer: string | null
    correctAnswer: string
    isCorrect: boolean
    explanation?: string
  }>
  onRetry: () => void
  onGoHome: () => void
  children?: React.ReactNode
}

// Confetti component for celebration
const Confetti = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])

  useEffect(() => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
    setParticles(newParticles)

    const timer = setTimeout(() => setParticles([]), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{ scale: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            y: [0, -100, -200],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

const getPerformanceGrade = (percentage: number) => {
  if (percentage >= 90) return { grade: "Excellent", color: "bg-green-500", textColor: "text-green-700" }
  if (percentage >= 80) return { grade: "Good", color: "bg-blue-500", textColor: "text-blue-700" }
  if (percentage >= 70) return { grade: "Fair", color: "bg-yellow-500", textColor: "text-yellow-700" }
  if (percentage >= 60) return { grade: "Pass", color: "bg-orange-500", textColor: "text-orange-700" }
  return { grade: "Needs Improvement", color: "bg-red-500", textColor: "text-red-700" }
}

export function QuizResultLayout({
  title = "Quiz Results",
  subtitle,
  score = 0,
  totalQuestions = 0,
  correctAnswers = 0,
  incorrectAnswers = 0,
  timeTaken,
  questions = [],
  onRetry = () => window.location.reload(),
  onGoHome = () => window.location.href = "/dashboard",
  children,
}: QuizResultLayoutProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [showConfetti, setShowConfetti] = useState(false)

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const performance = getPerformanceGrade(percentage)

  useEffect(() => {
    if (percentage >= 90) {
      setShowConfetti(true)
    }
  }, [percentage])

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {showConfetti && <Confetti />}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </motion.div>

        {/* Score Summary Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Correct Answers */}
                <div className="text-center space-y-2">
                  <motion.div
                    className="text-4xl font-bold text-green-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    {correctAnswers}
                  </motion.div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Correct</div>
                </div>

                {/* Incorrect Answers */}
                <div className="text-center space-y-2">
                  <motion.div
                    className="text-4xl font-bold text-red-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    {incorrectAnswers}
                  </motion.div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Incorrect</div>
                </div>

                {/* Total Questions */}
                <div className="text-center space-y-2">
                  <motion.div
                    className="text-4xl font-bold text-blue-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    {totalQuestions}
                  </motion.div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total</div>
                </div>

                {/* Grade */}
                <div className="text-center space-y-2">
                  <motion.div
                    className={cn("text-2xl font-bold", performance.textColor)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    {performance.grade}
                  </motion.div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Grade</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Score: {percentage}%</span>
                  {timeTaken && <span>Time: {timeTaken}</span>}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <motion.div
                    className={cn("h-3 rounded-full", performance.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onRetry}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retry Quiz
          </Button>
          <Button
            onClick={onGoHome}
            variant="outline"
            size="lg"
            className="px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home
          </Button>
        </motion.div>

        {/* Question Review */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Question Review</h2>
            </CardHeader>            <CardContent className="space-y-4">
              {Array.isArray(questions) && questions.length > 0 ? questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  className={cn(
                    "border-l-4 rounded-lg p-4 transition-all duration-200",
                    question.isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-red-500 bg-red-50 dark:bg-red-900/20",
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Question {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {question.type.toUpperCase()}
                      </Badge>
                      {question.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleQuestion(question.id)} className="p-1">
                      {expandedQuestions.has(question.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {expandedQuestions.has(question.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{question.question}</div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Your Answer */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Circle className="w-4 h-4 text-red-500 fill-current" />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Your Answer
                              </span>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                              <span className="text-slate-600 dark:text-slate-400 italic">
                                {question.userAnswer || "No answer selected"}
                              </span>
                            </div>
                          </div>

                          {/* Correct Answer */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Circle className="w-4 h-4 text-green-500 fill-current" />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Correct Answer
                              </span>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                              <span className="text-slate-700 dark:text-slate-300">{question.correctAnswer}</span>
                            </div>
                          </div>
                        </div>

                        {question.explanation && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2 mb-2">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Explanation</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm">{question.explanation}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )) : (
                <div className="p-6 text-center text-muted-foreground">
                  <div className="flex justify-center mb-4">
                    <XCircle className="h-12 w-12 text-muted-foreground/60" />
                  </div>
                  <p>No questions available to review.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {children}
      </div>
    </motion.div>
  )
}
