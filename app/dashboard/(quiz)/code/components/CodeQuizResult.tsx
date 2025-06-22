/**
 * Enhanced Code Quiz Result Component
 * 
 * Features:
 * - Displays code snippets in formatted code blocks
 * - Robust answer extraction logic for code answers
 * - Better visual design and layout for code-based quizzes
 * - Enhanced question review experience
 * - Educational features and insights for programming topics
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
  Search,
  Code
} from "lucide-react"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Confetti } from "@/components/ui/confetti"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RootState } from "@/store"

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
  codeSnippet?: string
  explanation?: string
  difficulty?: string
  category?: string
  language?: string
  timeSpent?: number
}

interface CodeQuizResultProps {
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
      codeSnippet?: string
    }>
  }
  onRetake?: () => void
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Enhanced answer extraction utility that handles multiple data formats for code quizzes
 */
function extractUserAnswers(result: CodeQuizResultProps['result']): ProcessedAnswer[] {
  const { questionResults = [], questions = [], answers = [] } = result
  
  return questionResults.map((qResult) => {
    const questionId = String(qResult.questionId)
    
    // Find the original question data
    const originalQuestion = questions.find(q => String(q.id) === questionId)
    
    // Find the answer data from multiple sources
    const answerFromResults = answers.find(a => String(a.questionId) === questionId)
    
    // Extract options with proper fallbacks
    const allOptions = originalQuestion?.options || qResult.options || []
    const normalizedOptions = allOptions.map((opt: any, index: number) => {
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
      const matchingOption = normalizedOptions.find((opt: any) => 
        opt.text === userText || opt.value === userText
      )
      if (matchingOption) {
        userAnswerId = matchingOption.id
        userAnswerText = matchingOption.text
      }
    }
    
    // Strategy 4: If we have an ID, get the text
    if (userAnswerId && !userAnswerText) {
      const selectedOption = normalizedOptions.find((opt: any) => opt.id === userAnswerId)
      if (selectedOption) {
        userAnswerText = selectedOption.text
      }
    }
    
    // Strategy 5: Try to infer from correctness and options
    if (!userAnswerId && !userAnswerText && normalizedOptions.length > 0) {
      // If marked as correct, try to match with correct answer
      if (qResult.isCorrect) {        const correctOption = normalizedOptions.find((opt: any) => 
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
    const correctOption = normalizedOptions.find((opt: any) => 
      opt.text === correctAnswerText || opt.value === correctAnswerText
    )
    const correctAnswerId = correctOption?.id || ''
    
    // Determine if answer is actually correct
    const isCorrect = userAnswerId ? userAnswerId === correctAnswerId : qResult.isCorrect
    
    // Extract code snippet
    const codeSnippet = qResult.codeSnippet || originalQuestion?.codeSnippet || ''
    
    // Get language from metadata
    const language = originalQuestion?.language || 'javascript'

    return {
      questionId,
      question: qResult.question || originalQuestion?.question || '',
      userAnswer: userAnswerText || '(No answer selected)',
      userAnswerId,
      correctAnswer: correctAnswerText || '(No correct answer provided)',
      correctAnswerId,
      isCorrect,
      type: qResult.type || originalQuestion?.type || 'code',
      options: normalizedOptions.filter((o: any) => o.id === userAnswerId),
      allOptions: normalizedOptions,
      codeSnippet,
      explanation: originalQuestion?.explanation || '',
      difficulty: originalQuestion?.difficulty || '',
      category: originalQuestion?.category || '',
      language,
      timeSpent: answerFromResults?.timestamp 
        ? Date.now() - answerFromResults.timestamp 
        : 0
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
      message: "Outstanding! You've mastered this coding topic.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "🏆",
      grade: "A+",
      insights: "Your coding skills in this area are exceptional. You're ready for more advanced challenges."
    }

  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding of these concepts.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
      grade: "A",
      insights: "You have a solid grasp of these programming concepts. Focus on the few questions you missed to achieve full mastery."
    }

  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your coding knowledge is solid.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
      grade: "B",
      insights: "You're on the right track with your coding skills. Review the questions you missed to strengthen your knowledge."
    }

  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep practicing to improve your coding skills.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
      grade: "C",
      insights: "You're making progress in understanding these coding concepts. More practice will help solidify your knowledge."
    }

  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More coding practice needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
      grade: "D",
      insights: "Continue practicing these coding concepts. Try to understand the patterns in the questions you missed."
    }

  return {
    level: "Poor",
    message: "Keep learning! Review these programming concepts thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
    grade: "F",
    insights: "This is a learning opportunity. Take time to study these coding concepts and try again."
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {
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
  
  const title = result?.title || "Code Quiz Results"
  const score = typeof result?.score === "number" ? result.score : 0
  const maxScore = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
  const percentage = typeof result?.percentage === "number" ? result.percentage : 
    Math.round((score / Math.max(maxScore, 1)) * 100)
  
  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage])
  
  // Filter questions based on current filter and search
  const filteredQuestions = useMemo(() => {
    // Apply search filter first
    let filtered = processedAnswers
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.userAnswer.toLowerCase().includes(query) ||
        q.correctAnswer.toLowerCase().includes(query) ||
        q.codeSnippet?.toLowerCase().includes(query) ||
        q.category?.toLowerCase().includes(query)
      )
    }
    
    // Apply correctness filter
    if (filterType === 'correct') {
      filtered = filtered.filter(q => q.isCorrect)
    } else if (filterType === 'incorrect') {
      filtered = filtered.filter(q => !q.isCorrect)
    }
    
    return filtered
  }, [processedAnswers, filterType, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const totalQuestions = processedAnswers.length
    const correctCount = processedAnswers.filter(a => a.isCorrect).length
    const incorrectCount = totalQuestions - correctCount
    
    const byCategory = processedAnswers.reduce((acc, answer) => {
      const category = answer.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { total: 0, correct: 0 }
      }
      acc[category].total += 1
      if (answer.isCorrect) {
        acc[category].correct += 1
      }
      return acc
    }, {} as Record<string, { total: number, correct: number }>)
    
    const byDifficulty = processedAnswers.reduce((acc, answer) => {
      const difficulty = answer.difficulty || 'Medium'
      if (!acc[difficulty]) {
        acc[difficulty] = { total: 0, correct: 0 }
      }
      acc[difficulty].total += 1
      if (answer.isCorrect) {
        acc[difficulty].correct += 1
      }
      return acc
    }, {} as Record<string, { total: number, correct: number }>)
    
    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      byCategory,
      byDifficulty
    }
  }, [processedAnswers])

  // Effects
  useEffect(() => {
    if (percentage >= 70 && !hasShownConfettiRef.current) {
      // Delay showing confetti for more visual impact
      const timer = setTimeout(() => {
        setShowConfetti(true)
        hasShownConfettiRef.current = true
        
        // Hide after a while
        setTimeout(() => setShowConfetti(false), 4000)
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Event handlers
  const handleRetry = useCallback(() => {
    if (typeof onRetake === 'function') {
      onRetake()
    } else if (result.slug) {
      router.push(`/dashboard/code/${result.slug}`)
    }
  }, [onRetake, router, result.slug])

  const handleGoHome = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleShare = async () => {
    try {
      const shareText = `I scored ${percentage}% (${score}/${maxScore}) on the "${title}" coding quiz! #CodeChallenge`
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Quiz Results',
          text: shareText,
          url: window.location.href
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText + '\n' + window.location.href)
        alert('Results copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const navigateQuestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (direction === 'next' && currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
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
              {question.language && (
                <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                  {question.language}
                </Badge>
              )}              {question.timeSpent && question.timeSpent > 0 && (
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

          {/* Code Snippet Display */}
          {question.codeSnippet && (
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Code Snippet
              </h4>
              <div className="relative">
                <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg overflow-x-auto text-sm">
                  <code>{question.codeSnippet}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {question.language || 'code'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

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

          {question.explanation && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mt-4">
              <h4 className="font-semibold text-sm text-blue-800 uppercase flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4" />
                Explanation
              </h4>
              <p className="text-blue-700 text-sm">{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderSingleQuestionView = () => {
    if (filteredQuestions.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No matching questions found
        </div>
      )
    }

    const currentQuestion = filteredQuestions[currentQuestionIndex]
    
    return (
      <div className="space-y-4">
        {renderQuestionCard(currentQuestion, currentQuestionIndex)}
        
        <div className="flex items-center justify-between border-t pt-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {filteredQuestions.length}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateQuestion('prev')}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateQuestion('next')}
              disabled={currentQuestionIndex === filteredQuestions.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showConfetti && <Confetti isActive={true} />}
      
      <div className="space-y-8">
        {/* Score Card */}
        <motion.div 
          className={`bg-gradient-to-r from-muted/30 to-muted/10 rounded-3xl border-2 border-muted/30 shadow-2xl overflow-hidden`}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground line-clamp-2">
                    {title}
                  </h1>
                  <p className="text-muted-foreground">
                    Completed: {result.completedAt ? new Date(result.completedAt).toLocaleString() : 'Recently'}
                  </p>
                </motion.div>

                <motion.div
                  className={`flex items-center ${performance.color} gap-3 text-2xl md:text-3xl font-bold`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className={`w-14 h-14 rounded-full ${performance.bgColor} ${performance.borderColor} border-2 flex items-center justify-center text-4xl`}>
                    {performance.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {performance.level}
                      <Badge className={`text-lg py-0.5 px-2 ${performance.bgColor} ${performance.color} border-none font-bold`}>
                        {performance.grade}
                      </Badge>
                    </div>
                    <div className="text-base font-medium text-muted-foreground mt-1">
                      {performance.message}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                className="space-y-6 flex flex-col justify-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Score</span>
                    <span className="text-xl">
                      {score}/{maxScore} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-3" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl bg-green-50 border border-green-200 p-3 text-center`}>
                    <div className="text-2xl font-bold text-green-600">{stats.correctCount}</div>
                    <div className="text-xs text-green-700 font-medium">Correct</div>
                  </div>
                  <div className={`rounded-xl bg-red-50 border border-red-200 p-3 text-center`}>
                    <div className="text-2xl font-bold text-red-600">{stats.incorrectCount}</div>
                    <div className="text-xs text-red-700 font-medium">Incorrect</div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake Quiz
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="overview">
              <Target className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="questions">
              <BookOpen className="w-4 h-4 mr-2" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              className="rounded-3xl shadow-2xl border-2 border-muted/20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <CardHeader className="p-8 bg-gradient-to-r from-muted/10 to-muted/20 border-b-2 border-muted/20">
                <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                  <Code className="w-7 h-7 text-primary" />
                  Quiz Performance Summary
                </CardTitle>
                <p className="text-muted-foreground text-lg">
                  Review your performance across categories
                </p>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* By Category */}
                  <div className="rounded-xl border-2 border-muted/30 p-6 bg-gradient-to-r from-background to-muted/10">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Performance by Category
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.byCategory).map(([category, data]) => (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{category}</span>
                            <span>
                              {data.correct}/{data.total} ({Math.round((data.correct / data.total) * 100)}%)
                            </span>
                          </div>
                          <Progress 
                            value={Math.round((data.correct / data.total) * 100)} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By Difficulty */}
                  <div className="rounded-xl border-2 border-muted/30 p-6 bg-gradient-to-r from-background to-muted/10">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Performance by Difficulty
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.byDifficulty).map(([difficulty, data]) => (
                        <div key={difficulty} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{difficulty}</span>
                            <span>
                              {data.correct}/{data.total} ({Math.round((data.correct / data.total) * 100)}%)
                            </span>
                          </div>
                          <Progress 
                            value={Math.round((data.correct / data.total) * 100)} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <Code className="w-7 h-7 text-primary" />
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
                  <Code className="w-12 h-12 text-primary" />
                  <h2 className="text-3xl font-bold">Coding Insights</h2>
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
                    <h3 className="text-xl font-bold text-blue-800 mb-3">
                      Strengths
                    </h3>
                    <ul className="text-left space-y-3 text-blue-700">
                      {percentage >= 80 && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Strong understanding of coding concepts tested</span>
                        </li>
                      )}
                      {stats.correctCount >= stats.incorrectCount * 2 && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Consistently correct answers across different questions</span>
                        </li>
                      )}
                      {Object.entries(stats.byCategory).some(([_, data]) => 
                        (data.correct / data.total) >= 0.8
                      ) && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Excellent performance in some specific categories</span>
                        </li>
                      )}
                      {Object.entries(stats.byDifficulty).some(([_, data]) => 
                        (data.correct / data.total) >= 0.7 && data.total >= 2
                      ) && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Good handling of questions across difficulty levels</span>
                        </li>
                      )}
                      {/* Fallback if no specific strengths identified */}
                      {!(percentage >= 80 || 
                        stats.correctCount >= stats.incorrectCount * 2 ||
                        Object.entries(stats.byCategory).some(([_, data]) => (data.correct / data.total) >= 0.8) ||
                        Object.entries(stats.byDifficulty).some(([_, data]) => (data.correct / data.total) >= 0.7 && data.total >= 2)
                      ) && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>You've taken the first step to improve your coding skills</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200">
                    <h3 className="text-xl font-bold text-amber-800 mb-3">
                      Areas to Improve
                    </h3>
                    <ul className="text-left space-y-3 text-amber-700">
                      {percentage < 70 && (
                        <li className="flex items-start gap-2">
                          <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Focus on strengthening your foundation in coding concepts</span>
                        </li>
                      )}
                      {stats.incorrectCount > stats.correctCount && (
                        <li className="flex items-start gap-2">
                          <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Practice more coding exercises to build confidence</span>
                        </li>
                      )}
                      {Object.entries(stats.byCategory).some(([_, data]) => 
                        (data.correct / data.total) <= 0.5 && data.total >= 2
                      ) && (
                        <li className="flex items-start gap-2">
                          <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Review specific categories where you scored lower</span>
                        </li>
                      )}
                      {Object.entries(stats.byDifficulty).some(([difficulty, data]) => 
                        difficulty !== "Easy" && (data.correct / data.total) <= 0.6 && data.total >= 2
                      ) && (
                        <li className="flex items-start gap-2">
                          <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Work on tackling higher difficulty questions</span>
                        </li>
                      )}
                      {/* Fallback if no specific improvement areas identified */}
                      {!(percentage < 70 || 
                        stats.incorrectCount > stats.correctCount ||
                        Object.entries(stats.byCategory).some(([_, data]) => (data.correct / data.total) <= 0.5 && data.total >= 2) ||
                        Object.entries(stats.byDifficulty).some(([difficulty, data]) => difficulty !== "Easy" && (data.correct / data.total) <= 0.6 && data.total >= 2)
                      ) && (
                        <li className="flex items-start gap-2">
                          <BookOpen className="w-5 h-5 mt-0.5 shrink-0" />
                          <span>Continue practicing to maintain your excellent coding skills</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Next Step Suggestions */}
                <div className="mt-8 max-w-2xl mx-auto text-left">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Next Steps
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-background border border-muted flex items-start gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <div>
                        <h4 className="font-semibold">Retake This Quiz</h4>
                        <p className="text-muted-foreground text-sm">Cement your understanding by taking this quiz again</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-muted flex items-start gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <div>
                        <h4 className="font-semibold">Study Related Topics</h4>
                        <p className="text-muted-foreground text-sm">Expand your knowledge with related coding concepts</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-muted flex items-start gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                        <Code className="h-4 w-4" />
                      </Button>
                      <div>
                        <h4 className="font-semibold">Try Advanced Challenges</h4>
                        <p className="text-muted-foreground text-sm">Challenge yourself with more difficult coding problems</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

