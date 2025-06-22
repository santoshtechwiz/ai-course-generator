/**
 * Quiz Result Utilities and Helper Components
 * 
 * Supporting utilities for the enhanced quiz result component:
 * - Data processing functions
 * - Redux selector improvements
 * - Type definitions
 * - Helper components
 * 
 * @author Manus AI
 * @version Enhanced
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QuizAnswer {
  questionId: string
  selectedOptionId: string | null
  userAnswer: string
  isCorrect: boolean
  timestamp: number
  timeSpent?: number
  type?: string
}

export interface QuizQuestion {
  id: number | string
  question: string
  options: string[] | Array<{ id: string; text: string; value?: string }>
  answer: string
  correctOptionId?: string | number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  codeSnippet?: string
}

export interface QuizResult {
  quizId: string
  slug: string
  title: string
  quizType: string
  score: number
  maxScore: number
  percentage: number
  totalAnswered: number
  completedAt: string
  submittedAt: string
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  questionResults: Array<{
    questionId: string
    isCorrect: boolean
    userAnswer: string | null
    correctAnswer: string
    skipped: boolean
  }>
}

export interface QuizState {
  questions: QuizQuestion[]
  answers: Record<string, QuizAnswer>
  results: QuizResult | null
  currentQuestionIndex: number
  isCompleted: boolean
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

// ============================================================================
// ENHANCED REDUX SELECTORS
// ============================================================================

import { createSelector } from '@reduxjs/toolkit'

// Enhanced selector for quiz results with proper data extraction
export const selectEnhancedQuizResults = createSelector(
  [(state: any) => state.quiz.results, (state: any) => state.quiz.questions, (state: any) => state.quiz.answers],
  (results, questions, answers) => {
    if (!results) return null

    // Process and enhance the results data
    const enhancedResults = {
      ...results,
      processedAnswers: Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find((q: QuizQuestion) => String(q.id) === questionId)
        const questionResult = results.questionResults?.find((qr: any) => String(qr.questionId) === questionId)
        
        return {
          questionId,
          question: question?.question || '',
          userAnswer: answer.userAnswer || extractUserAnswerText(answer, question),
          userAnswerId: answer.selectedOptionId,
          correctAnswer: question?.answer || questionResult?.correctAnswer || '',
          isCorrect: answer.isCorrect,
          options: normalizeOptions(question?.options || []),
          explanation: question?.explanation,
          difficulty: question?.difficulty,
          category: question?.category,
          timeSpent: answer.timeSpent || 0,
          timestamp: answer.timestamp
        }
      })
    }

    return enhancedResults
  }
)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract user answer text from answer object and question data
 */
export function extractUserAnswerText(answer: QuizAnswer, question?: QuizQuestion): string {
  if (answer.userAnswer && answer.userAnswer.trim()) {
    return answer.userAnswer
  }

  if (answer.selectedOptionId && question?.options) {
    const normalizedOptions = normalizeOptions(question.options)
    const selectedOption = normalizedOptions.find(opt => 
      String(opt.id) === String(answer.selectedOptionId)
    )
    if (selectedOption) {
      return selectedOption.text
    }
  }

  return ''
}

/**
 * Normalize options to consistent format
 */
export function normalizeOptions(options: any[]): Array<{ id: string; text: string; value: string }> {
  if (!Array.isArray(options)) return []

  return options.map((option, index) => {
    if (typeof option === 'string') {
      return {
        id: String(index),
        text: option,
        value: option
      }
    }

    if (typeof option === 'object' && option !== null) {
      return {
        id: String(option.id ?? index),
        text: option.text || option.value || String(option),
        value: option.value || option.text || String(option)
      }
    }

    return {
      id: String(index),
      text: String(option),
      value: String(option)
    }
  })
}

/**
 * Calculate detailed quiz statistics
 */
export function calculateQuizStatistics(answers: QuizAnswer[], questions: QuizQuestion[]) {
  const totalQuestions = questions.length
  const answeredQuestions = Object.keys(answers).length
  const correctAnswers = Object.values(answers).filter(a => a.isCorrect).length
  const incorrectAnswers = answeredQuestions - correctAnswers
  const skippedQuestions = totalQuestions - answeredQuestions
  
  const totalTime = Object.values(answers).reduce((sum, a) => sum + (a.timeSpent || 0), 0)
  const averageTime = answeredQuestions > 0 ? totalTime / answeredQuestions : 0
  
  const accuracy = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0
  const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    incorrectAnswers,
    skippedQuestions,
    totalTime,
    averageTime,
    accuracy: Math.round(accuracy),
    completionRate: Math.round(completionRate),
    score: correctAnswers,
    maxScore: totalQuestions,
    percentage: Math.round(accuracy)
  }
}

/**
 * Enhanced performance analysis
 */
export function analyzePerformance(statistics: ReturnType<typeof calculateQuizStatistics>) {
  const { accuracy, averageTime, completionRate } = statistics
  
  const timePerformance = averageTime < 30000 ? 'fast' : averageTime < 60000 ? 'moderate' : 'slow'
  const accuracyLevel = accuracy >= 90 ? 'excellent' : accuracy >= 80 ? 'good' : accuracy >= 70 ? 'fair' : 'poor'
  
  const strengths: string[] = []
  const improvements: string[] = []
  
  if (accuracy >= 80) strengths.push('Strong understanding of concepts')
  if (timePerformance === 'fast') strengths.push('Efficient time management')
  if (completionRate === 100) strengths.push('Completed all questions')
  
  if (accuracy < 70) improvements.push('Review fundamental concepts')
  if (timePerformance === 'slow') improvements.push('Practice for better speed')
  if (completionRate < 100) improvements.push('Complete all questions next time')
  
  return {
    timePerformance,
    accuracyLevel,
    strengths,
    improvements,
    overallGrade: getGradeFromAccuracy(accuracy)
  }
}

/**
 * Get letter grade from accuracy percentage
 */
export function getGradeFromAccuracy(accuracy: number): string {
  if (accuracy >= 97) return 'A+'
  if (accuracy >= 93) return 'A'
  if (accuracy >= 90) return 'A-'
  if (accuracy >= 87) return 'B+'
  if (accuracy >= 83) return 'B'
  if (accuracy >= 80) return 'B-'
  if (accuracy >= 77) return 'C+'
  if (accuracy >= 73) return 'C'
  if (accuracy >= 70) return 'C-'
  if (accuracy >= 67) return 'D+'
  if (accuracy >= 65) return 'D'
  return 'F'
}

/**
 * Generate study recommendations based on performance
 */
export function generateStudyRecommendations(
  answers: QuizAnswer[], 
  questions: QuizQuestion[]
): string[] {
  const incorrectQuestions = Object.entries(answers)
    .filter(([_, answer]) => !answer.isCorrect)
    .map(([questionId, _]) => questions.find(q => String(q.id) === questionId))
    .filter(Boolean) as QuizQuestion[]

  const recommendations: string[] = []
  
  if (incorrectQuestions.length === 0) {
    recommendations.push('Excellent work! You\'ve mastered this topic.')
    recommendations.push('Consider helping others or exploring advanced topics.')
    return recommendations
  }

  // Analyze categories of incorrect answers
  const categories = incorrectQuestions.reduce((acc, q) => {
    const category = q.category || 'General'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const weakestCategory = Object.entries(categories)
    .sort(([,a], [,b]) => b - a)[0]

  if (weakestCategory) {
    recommendations.push(`Focus on ${weakestCategory[0]} concepts - you missed ${weakestCategory[1]} questions in this area.`)
  }

  // Difficulty analysis
  const hardQuestions = incorrectQuestions.filter(q => q.difficulty === 'hard').length
  const mediumQuestions = incorrectQuestions.filter(q => q.difficulty === 'medium').length
  const easyQuestions = incorrectQuestions.filter(q => q.difficulty === 'easy').length

  if (easyQuestions > 0) {
    recommendations.push('Review basic concepts - you missed some fundamental questions.')
  }
  if (mediumQuestions > hardQuestions && mediumQuestions > 0) {
    recommendations.push('Practice intermediate-level problems to strengthen your understanding.')
  }
  if (hardQuestions > 0) {
    recommendations.push('Challenge yourself with advanced practice problems.')
  }

  // Time-based recommendations
  const slowAnswers = Object.values(answers).filter(a => (a.timeSpent || 0) > 60000).length
  if (slowAnswers > answers.length * 0.3) {
    recommendations.push('Practice timed exercises to improve your response speed.')
  }

  return recommendations
}

// ============================================================================
// ENHANCED REDUX ACTIONS
// ============================================================================

/**
 * Enhanced saveAnswer action that properly stores user selections
 */
export const enhancedSaveAnswer = (questionId: string, selectedOptionId: string, question: QuizQuestion) => {
  const normalizedOptions = normalizeOptions(question.options)
  const selectedOption = normalizedOptions.find(opt => String(opt.id) === String(selectedOptionId))
  const userAnswerText = selectedOption?.text || ''
  
  const correctOption = normalizedOptions.find(opt => 
    opt.text === question.answer || 
    String(opt.id) === String(question.correctOptionId)
  )
  
  const isCorrect = selectedOption && correctOption ? 
    String(selectedOption.id) === String(correctOption.id) : false

  return {
    type: 'quiz/saveAnswer',
    payload: {
      questionId: String(questionId),
      answer: {
        selectedOptionId: String(selectedOptionId),
        userAnswer: userAnswerText,
        isCorrect,
        timestamp: Date.now(),
        timeSpent: 0, // This should be calculated from when question was first shown
        type: 'mcq'
      }
    }
  }
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

/**
 * Option display component with proper styling
 */
export const OptionDisplay: React.FC<{
  option: { id: string; text: string }
  index: number
  isSelected: boolean
  isCorrect: boolean
  showResult: boolean
}> = ({ option, index, isSelected, isCorrect, showResult }) => {
  let className = "p-4 rounded-xl border-2 transition-all duration-200 "
  let textColor = "text-muted-foreground"
  let icon = null

  if (showResult) {
    if (isSelected && isCorrect) {
      className += "bg-green-50 border-green-200 ring-2 ring-green-100"
      textColor = "text-green-700"
      icon = <CheckCircle className="w-5 h-5 text-green-600" />
    } else if (isSelected && !isCorrect) {
      className += "bg-red-50 border-red-200 ring-2 ring-red-100"
      textColor = "text-red-700"
      icon = <XCircle className="w-5 h-5 text-red-600" />
    } else if (!isSelected && isCorrect) {
      className += "bg-green-50 border-green-200"
      textColor = "text-green-700"
      icon = <CheckCircle className="w-5 h-5 text-green-600" />
    } else {
      className += "bg-muted/20 border-muted/30"
    }
  } else {
    className += isSelected ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-muted/30"
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-background border-2 border-muted/30 flex items-center justify-center text-sm font-semibold">
          {String.fromCharCode(65 + index)}
        </div>
        <span className={`flex-1 font-medium ${textColor}`}>
          {option.text}
        </span>
        <div className="flex items-center gap-2">
          {isSelected && showResult && (
            <Badge variant="outline" className="text-xs">
              Your Choice
            </Badge>
          )}
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Performance badge component
 */
export const PerformanceBadge: React.FC<{
  percentage: number
  size?: 'sm' | 'md' | 'lg'
}> = ({ percentage, size = 'md' }) => {
  const performance = getPerformanceLevel(percentage)
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <Badge
      variant="secondary"
      className={`font-semibold shadow-md ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2 ${sizeClasses[size]}`}
    >
      <span className="mr-2">{performance.emoji}</span>
      {performance.level}
    </Badge>
  )
}

function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "🏆"
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯"
    }
  if (percentage >= 70)
    return {
      level: "Good",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅"
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚"
    }
  return {
    level: "Needs Work",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖"
  }
}

/**
 * Time display component
 */
export const TimeDisplay: React.FC<{
  timeInMs: number
  showIcon?: boolean
}> = ({ timeInMs, showIcon = true }) => {
  const seconds = Math.round(timeInMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  const timeString = minutes > 0 
    ? `${minutes}m ${remainingSeconds}s`
    : `${seconds}s`

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {showIcon && <Clock className="w-3 h-3" />}
      {timeString}
    </div>
  )
}

export default {
  extractUserAnswerText,
  normalizeOptions,
  calculateQuizStatistics,
  analyzePerformance,
  getGradeFromAccuracy,
  generateStudyRecommendations,
  enhancedSaveAnswer,
  OptionDisplay,
  PerformanceBadge,
  TimeDisplay
}

