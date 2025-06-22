/**
 * Enhanced MCQ Quiz Result Component
 * 
 * Fixes:
 * - User answer rendering issues
 * - Data extraction and mapping problems
 * - Poor UX for reviewing questions and answers
 * 
 * Improvements:
 * - Robust answer extraction logic
 * - Better visual design and layout
 * - Enhanced question review experience
 * - Educational features and insights
 * 
 * @author Manus AI
 * @version Enhanced
 */

"use client"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Target, 
  Share2, 
  RefreshCw, 
  Home,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  Filter,
  Search
} from "lucide-react"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Confetti } from "@/components/ui/confetti"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface QuestionOption {
  id?: string
  text?: string
  value?: string
}

interface ProcessedAnswer {
  questionId: string
  question: string
  userAnswer: string
  userAnswerId: string
  correctAnswer: string
  correctAnswerId: string
  isCorrect: boolean
  type: string
  options: QuestionOption[]
  allOptions: QuestionOption[]
  explanation?: string
  difficulty?: string
  category?: string
  timeSpent?: number
}

interface McqQuizResultProps {
  result: {
    title?: string
    slug?: string
    quizId?: string
    score: number
    maxScore: number
    percentage: number
    completedAt?: string
    totalTime?: number
    questions?: Array<any>
    answers?: Array<any>
    questionResults: Array<{
      questionId: string
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      type: string
      options?: Array<QuestionOption>
      selectedOptionId?: string
    }>
  }
  onRetake?: () => void
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Enhanced answer extraction utility that handles multiple data formats
 */
function extractUserAnswers(result: McqQuizResultProps['result']): ProcessedAnswer[] {
  const { questionResults = [], questions = [], answers = [] } = result
  
  return questionResults.map((qResult) => {
    const questionId = String(qResult.questionId)
    
    // Find the original question data
    const originalQuestion = questions.find(q => String(q.id) === questionId)
    
    // Find the answer data from multiple sources
    const answerFromResults = answers.find(a => String(a.questionId) === questionId)
    
    // Extract options with proper fallbacks
    const allOptions = originalQuestion?.options || qResult.options || []
    const normalizedOptions = allOptions.map((opt, index) => {
      if (typeof opt === 'string') {
        return { id: String(index), text: opt, value: opt }
      }
      return {
        id: String(opt.id || index),
        text: opt.text || opt.value || opt,
        value: opt.value || opt.text || opt
      }
    })
    
    // Extract user's selected answer with multiple fallback strategies
    let userAnswerId = ''
    let userAnswerText = ''
    
    // Strategy 1: From answer object
    if (answerFromResults?.selectedOptionId) {
      userAnswerId = String(answerFromResults.selectedOptionId)
    }
    
    // Strategy 2: From question result
    if (!userAnswerId && qResult.selectedOptionId) {
      userAnswerId = String(qResult.selectedOptionId)
    }
    
    // Strategy 3: From user answer text (try to match back to option)
    if (!userAnswerId && (answerFromResults?.userAnswer || qResult.userAnswer)) {
      const userText = answerFromResults?.userAnswer || qResult.userAnswer
      const matchingOption = normalizedOptions.find(opt => 
        opt.text === userText || opt.value === userText
      )
      if (matchingOption) {
        userAnswerId = matchingOption.id
        userAnswerText = matchingOption.text
      }
    }
    
    // Strategy 4: If we have an ID, get the text
    if (userAnswerId && !userAnswerText) {
      const selectedOption = normalizedOptions.find(opt => opt.id === userAnswerId)
      if (selectedOption) {
        userAnswerText = selectedOption.text
      }
    }
    
    // Strategy 5: Try to infer from correctness and options
    if (!userAnswerId && !userAnswerText && normalizedOptions.length > 0) {
      // If marked as correct, try to match with correct answer
      if (qResult.isCorrect) {
        const correctOption = normalizedOptions.find(opt => 
          opt.text === qResult.correctAnswer || 
          opt.value === qResult.correctAnswer ||
          opt.text === originalQuestion?.answer
        )
        if (correctOption) {
          userAnswerId = correctOption.id
          userAnswerText = correctOption.text
        }
      }
    }
    
    // Extract correct answer information
    const correctAnswerText = qResult.correctAnswer || originalQuestion?.answer || ''
    const correctOption = normalizedOptions.find(opt => 
      opt.text === correctAnswerText || opt.value === correctAnswerText
    )
    const correctAnswerId = correctOption?.id || ''
    
    // Determine if answer is actually correct
    const isCorrect = userAnswerId ? userAnswerId === correctAnswerId : qResult.isCorrect
    
    return {
      questionId,
      question: qResult.question || originalQuestion?.question || '',
      userAnswer: userAnswerText || '(No answer selected)',
      userAnswerId,
      correctAnswer: correctAnswerText,
      correctAnswerId,
      isCorrect,
      type: qResult.type || 'mcq',
      options: normalizedOptions,
      allOptions: normalizedOptions,
      explanation: originalQuestion?.explanation || '',
      difficulty: originalQuestion?.difficulty || 'medium',
      category: originalQuestion?.category || '',
      timeSpent: answerFromResults?.timeSpent || 0
    }
  })
}

/**
 * Performance level calculation with enhanced feedback
 */
function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "🏆",
      grade: "A+",
      insights: "You demonstrate exceptional understanding. Consider teaching others!"
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
      grade: "A",
      insights: "Excellent work! Review the few mistakes to achieve perfection."
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
      grade: "B",
      insights: "Good foundation! Focus on the areas you missed for improvement."
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
      grade: "C",
      insights: "You're on the right track. More practice will boost your confidence."
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
      grade: "D",
      insights: "Don't give up! Review the material and try again."
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
    grade: "F",
    insights: "This is a learning opportunity. Take time to study the concepts."
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function McqQuizResult({ result, onRetake }: McqQuizResultProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAllQuestions, setShowAllQuestions] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const hasShownConfettiRef = useRef(false)

  // Process and validate data
  const processedAnswers = useMemo(() => extractUserAnswers(result), [result])
  
  const title = result?.title || "Quiz Results"
  const score = typeof result?.score === "number" ? result.score : 0
  const maxScore = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
  const percentage = typeof result?.percentage === "number" ? result.percentage : 
    Math.round((score / Math.max(maxScore, 1)) * 100)
  
  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])
  
  // Filter questions based on current filter and search
  const filteredQuestions = useMemo(() => {
    let filtered = processedAnswers
    
    // Apply filter
    if (filterType === 'correct') {
      filtered = filtered.filter(q => q.isCorrect)
    } else if (filterType === 'incorrect') {
      filtered = filtered.filter(q => !q.isCorrect)
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.userAnswer.toLowerCase().includes(query) ||
        q.correctAnswer.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [processedAnswers, filterType, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const correct = processedAnswers.filter(q => q.isCorrect).length
    const incorrect = processedAnswers.length - correct
    const totalTime = processedAnswers.reduce((sum, q) => sum + (q.timeSpent || 0), 0)
    const avgTime = totalTime / processedAnswers.length || 0
    
    return {
      correct,
      incorrect,
      total: processedAnswers.length,
      totalTime,
      avgTime,
      accuracy: Math.round((correct / Math.max(processedAnswers.length, 1)) * 100)
    }
  }, [processedAnswers])

  // Effects
  useEffect(() => {
    if (result && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Event handlers
  const handleRetry = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else {
      router.push(`/dashboard/mcq/${result.slug || ""}`)
    }
  }, [onRetake, router, result.slug])

  const handleGoHome = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${title} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${title} quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } catch (error) {
      console.warn('Share failed:', error)
    }
  }

  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (direction === 'next' && currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // ========================================================================
  // RENDER COMPONENTS
  // ========================================================================

  const renderQuestionCard = (question: ProcessedAnswer, index: number) => (
    <motion.div
      key={question.questionId}
      className="p-6 rounded-2xl border-2 border-muted/30 bg-gradient-to-r from-background to-muted/5 shadow-lg hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
            question.isCorrect 
              ? "bg-green-100 text-green-600 border-2 border-green-200" 
              : "bg-red-100 text-red-600 border-2 border-red-200"
          }`}
        >
          {question.isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-foreground">
              Question {index + 1}
            </h3>
            <div className="flex items-center gap-2">
              {question.difficulty && (
                <Badge variant="outline" className="text-xs">
                  {question.difficulty}
                </Badge>
              )}
              {question.timeSpent > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round(question.timeSpent / 1000)}s
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-foreground mb-6 text-base leading-relaxed">
            {question.question}
          </p>

          {/* All Options Display */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Answer Options
            </h4>
            {question.allOptions.map((option, optIndex) => {
              const isUserChoice = option.id === question.userAnswerId
              const isCorrectChoice = option.id === question.correctAnswerId
              
              let optionStyle = "bg-muted/20 border-muted/30"
              let textStyle = "text-muted-foreground"
              let iconElement = null
              
              if (isUserChoice && isCorrectChoice) {
                // User selected correct answer
                optionStyle = "bg-green-50 border-green-200 ring-2 ring-green-100"
                textStyle = "text-green-700"
                iconElement = <CheckCircle className="w-5 h-5 text-green-600" />
              } else if (isUserChoice && !isCorrectChoice) {
                // User selected wrong answer
                optionStyle = "bg-red-50 border-red-200 ring-2 ring-red-100"
                textStyle = "text-red-700"
                iconElement = <XCircle className="w-5 h-5 text-red-600" />
              } else if (!isUserChoice && isCorrectChoice) {
                // Correct answer (not selected by user)
                optionStyle = "bg-green-50 border-green-200"
                textStyle = "text-green-700"
                iconElement = <CheckCircle className="w-5 h-5 text-green-600" />
              }
              
              return (
                <motion.div
                  key={option.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${optionStyle}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-muted/30 flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <span className={`flex-1 font-medium ${textStyle}`}>
                      {option.text}
                    </span>
                    {iconElement && (
                      <div className="flex items-center gap-2">
                        {isUserChoice && (
                          <Badge variant="outline" className="text-xs">
                            Your Choice
                          </Badge>
                        )}
                        {iconElement}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Answer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border-2 ${
                question.isCorrect
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">Your Answer:</span>
              </div>
              <p className={`font-medium ${
                question.isCorrect ? "text-green-700" : "text-red-700"
              }`}>
                {question.userAnswer}
              </p>
            </div>

            {!question.isCorrect && (
              <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-sm">Correct Answer:</span>
                </div>
                <p className="font-medium text-green-700">
                  {question.correctAnswer}
                </p>
              </div>
            )}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <motion.div
              className="mt-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-700">Explanation:</span>
              </div>
              <p className="text-blue-700 text-sm leading-relaxed">
                {question.explanation}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderSingleQuestionView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions match your current filter.</p>
        </div>
      )
    }

    const currentQuestion = filteredQuestions[currentQuestionIndex]
    
    return (
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigateQuestion('prev')}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {filteredQuestions.length}
            </p>
            <Progress 
              value={(currentQuestionIndex + 1) / filteredQuestions.length * 100} 
              className="w-32 h-2 mt-1"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigateQuestion('next')}
            disabled={currentQuestionIndex === filteredQuestions.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Question */}
        {renderQuestionCard(currentQuestion, 0)}
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="space-y-8 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Header */}
        <motion.div
          className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Trophy className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-left">
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {title}
              </motion.h1>
              <motion.div
                className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mt-2"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Badge
              variant="secondary"
              className={`px-4 py-2 text-lg font-bold shadow-md ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2`}
            >
              <span className="mr-2 text-xl">{performance.emoji}</span>
              {performance.grade} - {performance.level}
            </Badge>
            <div className="text-6xl font-black text-primary">
              {percentage}%
            </div>
          </div>

          <p className="text-muted-foreground text-lg">
            {performance.insights}
          </p>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Review
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Score Overview */}
            <motion.div
              className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <CardHeader className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border-b-2 border-primary/10 p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-primary" />
                  Performance Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="text-4xl font-black text-green-500 mb-2">
                      {stats.correct}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Correct</div>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="text-4xl font-black text-red-500 mb-2">
                      {stats.incorrect}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300 font-semibold">Incorrect</div>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="text-4xl font-black text-blue-500 mb-2">
                      {stats.accuracy}%
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Accuracy</div>
                  </motion.div>

                  <motion.div
                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 text-center shadow-lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="text-4xl font-black text-purple-500 mb-2">
                      {Math.round(stats.avgTime / 1000)}s
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 font-semibold">Avg Time</div>
                  </motion.div>
                </div>

                <div className="mt-8">
                  <div className="flex justify-between text-lg font-medium mb-3">
                    <span>Overall Progress</span>
                    <span>{stats.correct}/{stats.total} correct</span>
                  </div>
                  <Progress value={percentage} className="h-4 rounded-full" />
                </div>
              </CardContent>

              <CardFooter className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-t-2 border-muted/20 flex flex-wrap gap-4 justify-between p-8">
                <div className="flex gap-3">
                  <Button
                    onClick={handleRetry}
                    className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Retake Quiz
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2"
                  >
                    <Home className="w-5 h-5" />
                    All Quizzes
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Results
                </Button>
              </CardFooter>
            </motion.div>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-muted/20 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Questions</SelectItem>
                    <SelectItem value="correct">Correct Only</SelectItem>
                    <SelectItem value="incorrect">Incorrect Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showAllQuestions ? "default" : "outline"}
                  onClick={() => setShowAllQuestions(true)}
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  All Questions
                </Button>
                <Button
                  variant={!showAllQuestions ? "default" : "outline"}
                  onClick={() => setShowAllQuestions(false)}
                  size="sm"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  One by One
                </Button>
              </div>
            </div>

            {/* Questions Display */}
            <motion.div
              className="rounded-3xl shadow-2xl border-2 border-muted/20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <CardHeader className="p-8 bg-gradient-to-r from-muted/10 to-muted/20 border-b-2 border-muted/20">
                <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                  <Target className="w-7 h-7 text-primary" />
                  Answer Review ({filteredQuestions.length} Questions)
                </CardTitle>
                <p className="text-muted-foreground text-lg">
                  Review your answers and learn from mistakes
                </p>
              </CardHeader>

              <CardContent className="p-8">
                {showAllQuestions ? (
                  <div className="space-y-6">
                    {filteredQuestions.map((question, index) => 
                      renderQuestionCard(question, index)
                    )}
                  </div>
                ) : (
                  renderSingleQuestionView()
                )}
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <motion.div
              className="rounded-3xl shadow-2xl border-2 border-muted/20 p-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <Award className="w-12 h-12 text-primary" />
                  <h2 className="text-3xl font-bold">Learning Insights</h2>
                </div>
                
                <div className={`p-6 rounded-2xl ${performance.bgColor} ${performance.borderColor} border-2`}>
                  <div className="text-6xl mb-4">{performance.emoji}</div>
                  <h3 className={`text-2xl font-bold mb-2 ${performance.color}`}>
                    {performance.level} Performance
                  </h3>
                  <p className={`text-lg ${performance.color}`}>
                    {performance.message}
                  </p>
                  <p className="text-muted-foreground mt-4">
                    {performance.insights}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-200">
                    <h4 className="font-bold text-blue-700 mb-3">Strengths</h4>
                    <ul className="text-blue-600 space-y-2">
                      {stats.correct > 0 && <li>• Answered {stats.correct} questions correctly</li>}
                      {stats.accuracy >= 70 && <li>• Strong overall understanding</li>}
                      {stats.avgTime < 30000 && <li>• Good time management</li>}
                    </ul>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-orange-50 border-2 border-orange-200">
                    <h4 className="font-bold text-orange-700 mb-3">Areas for Improvement</h4>
                    <ul className="text-orange-600 space-y-2">
                      {stats.incorrect > 0 && <li>• Review {stats.incorrect} incorrect answers</li>}
                      {stats.accuracy < 70 && <li>• Focus on core concepts</li>}
                      {stats.avgTime > 60000 && <li>• Work on response speed</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}

