"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Trophy, 
  Star, 
  Share2, 
  Download, 
  RefreshCw, 
  Target, 
  BookOpen, 
  Brain, 
  Code,
  FileText,
  Award,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Sparkles,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import Confetti from "react-confetti"

interface QuizResultLayoutProps {
  children: React.ReactNode
  title?: string
  quizType?: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "quiz" | "others"
  slug?: string
  score?: number
  totalQuestions?: number
  correctAnswers?: number
  timeSpent?: number
  difficulty?: string
}

const quizTypeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  code: "Code Quiz", 
  blanks: "Fill Blanks",
  openended: "Open Ended",
  flashcard: "Flashcards",
  quiz: "Quiz",
  others: "Mixed Quiz",
}

const quizTypeIcons: Record<string, React.ComponentType<any>> = {
  mcq: Target,
  code: Code,
  blanks: FileText,
  openended: BookOpen,
  flashcard: Brain,
  quiz: Award,
  others: Zap,
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'from-green-500 to-emerald-500'
    case 'medium': return 'from-yellow-500 to-orange-500'
    case 'hard': return 'from-red-500 to-pink-500'
    default: return 'from-blue-500 to-purple-500'
  }
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'from-green-500 to-emerald-500'
  if (percentage >= 75) return 'from-blue-500 to-cyan-500'
  if (percentage >= 60) return 'from-yellow-500 to-orange-500'
  return 'from-red-500 to-pink-500'
}

const getPerformanceMessage = (percentage: number) => {
  if (percentage >= 90) return { title: "Outstanding!", message: "You're a quiz master! 🏆", icon: Trophy }
  if (percentage >= 75) return { title: "Great Job!", message: "Well done! Keep it up! ⭐", icon: Star }
  if (percentage >= 60) return { title: "Good Effort!", message: "You're on the right track! 📚", icon: BookOpen }
  return { title: "Keep Learning!", message: "Practice makes perfect! 💪", icon: TrendingUp }
}

const StatCard = ({ icon: Icon, label, value, color = "from-blue-500 to-purple-500" }: {
  icon: React.ComponentType<any>
  label: string
  value: string | number
  color?: string
}) => (
  <motion.div
    className="p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg"
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4 }}
    whileHover={{ y: -5, scale: 1.02 }}
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-r ${color} text-white shadow-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </motion.div>
)

const ActionButton = ({ onClick, children, variant = "default", className = "", ...props }: {
  onClick?: () => void
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  className?: string
  [key: string]: any
}) => {
  const baseClasses = "px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 hover:shadow-lg active:scale-95"
  
  const variantClasses = {
    default: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg",
    outline: "border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
  }

  return (
    <motion.button
      onClick={onClick}
      className={cn(baseClasses, variantClasses[variant], className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default function QuizResultLayout({ 
  children, 
  title = "Quiz Results", 
  quizType = "quiz", 
  slug,
  score = 0,
  totalQuestions = 10,
  correctAnswers = 0,
  timeSpent = 0,
  difficulty = "medium"
}: QuizResultLayoutProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const QuizIcon = quizTypeIcons[quizType] || Award
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const performanceData = getPerformanceMessage(percentage)
  const PerformanceIcon = performanceData.icon

  useEffect(() => {
    if (percentage >= 70) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [percentage])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I scored ${percentage}% on "${title}"!`,
          text: `Check out my quiz results: ${correctAnswers}/${totalQuestions} correct answers!`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      setShowShareModal(true)
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Downloading results...')
  }

  const handleRetake = () => {
    window.location.href = window.location.href.replace('/results', '')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.25}
          colors={['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B']}
        />
      )}

      {/* Enhanced Header */}
      <motion.header 
        className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <QuizIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50"
                  >
                    {quizTypeLabels[quizType] || "Quiz"}
                  </Badge>
                  {difficulty && (
                    <Badge 
                      className={cn(
                        "text-white border-0",
                        `bg-gradient-to-r ${getDifficultyColor(difficulty)}`
                      )}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Badge>
                  )}
                  {slug && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      {slug}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ActionButton 
                onClick={() => window.history.back()}
                variant="outline"
                className="hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Quizzes
              </ActionButton>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Summary */}
        <motion.div
          className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
            >
              <PerformanceIcon className="w-12 h-12" />
            </motion.div>
            
            <motion.h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {performanceData.title}
            </motion.h2>
            
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {performanceData.message}
            </motion.p>

            <motion.div
              className="flex items-center justify-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className={cn(
                "px-6 py-3 rounded-2xl text-2xl font-bold text-white shadow-lg",
                `bg-gradient-to-r ${getScoreColor(percentage)}`
              )}>
                {percentage}%
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {correctAnswers}/{totalQuestions}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Correct</p>
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={CheckCircle2}
              label="Correct Answers"
              value={correctAnswers}
              color="from-green-500 to-emerald-500"
            />
            <StatCard
              icon={XCircle}
              label="Incorrect Answers"
              value={totalQuestions - correctAnswers}
              color="from-red-500 to-pink-500"
            />
            <StatCard
              icon={Clock}
              label="Time Spent"
              value={formatTime(timeSpent)}
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={BarChart3}
              label="Accuracy"
              value={`${percentage}%`}
              color={getScoreColor(percentage)}
            />
          </div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ActionButton onClick={handleRetake} className="min-w-[180px]">
              <RefreshCw className="w-5 h-5" />
              Retake Quiz
            </ActionButton>
            
            <ActionButton onClick={handleShare} variant="outline">
              <Share2 className="w-5 h-5" />
              Share Results
            </ActionButton>
            
            <ActionButton onClick={handleDownload} variant="outline">
              <Download className="w-5 h-5" />
              Download Report
            </ActionButton>
            
            <ActionButton 
              onClick={() => window.location.href = '/dashboard/quizzes'}
              variant="ghost"
            >
              <Sparkles className="w-5 h-5" />
              Explore More Quizzes
            </ActionButton>
          </motion.div>
        </motion.div>

        {/* Detailed Results */}
        <motion.div
          className="rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}