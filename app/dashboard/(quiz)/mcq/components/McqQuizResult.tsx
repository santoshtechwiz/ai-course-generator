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
import { extractUserAnswers, getPerformanceLevel } from "@/lib/utils/quiz-utils"
import { McqQuizResultProps, QuestionOption } from "./mcq.props"
import { QuestionCard } from "../../components/QuestionCard"
import { QuestionNavigation } from "../../components/QuestionNavigation"
import { PerformanceSummary } from "../../components/PerformanceSummary"
import { ReviewControls } from "../../components/ReviewControls"
import { LearningInsights } from "./LearningInsights"


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

  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

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
    // Use the actual score from the result, or fallback to processed answers
    const correct = typeof result?.score === "number" ? result.score : processedAnswers.filter(q => q.isCorrect).length
    const total = typeof result?.maxScore === "number" ? result.maxScore : processedAnswers.length
    const incorrect = total - correct
    const totalTime = processedAnswers.reduce((sum, q) => sum + (q.timeSpent || 0), 0)
    const avgTime = totalTime / Math.max(total, 1) || 0
    
    return {
      correct,
      incorrect,
      total,
      totalTime,
      avgTime,
      // Use the actual percentage if available
      accuracy: typeof result?.percentage === "number" 
        ? result.percentage 
        : Math.round((correct / Math.max(total, 1)) * 100)
    }
  }, [result?.score, result?.maxScore, result?.percentage, processedAnswers])

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

  // Single question view using extracted components
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
        <QuestionNavigation
          currentIndex={currentQuestionIndex}
          total={filteredQuestions.length}
          onPrev={() => navigateQuestion('prev')}
          onNext={() => navigateQuestion('next')}
        />
        <QuestionCard question={currentQuestion} index={0} />
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
        {/* Header & Performance Summary */}
        <PerformanceSummary
          title={title}
          performance={performance}
          percentage={percentage}
          stats={stats}
          result={result}
          formatDate={formatDate}
          onRetry={handleRetry}
          onGoHome={handleGoHome}
          onShare={handleShare}
        />
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

          {/* Overview Tab is now handled by PerformanceSummary */}

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <ReviewControls
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              showAllQuestions={showAllQuestions}
              setShowAllQuestions={setShowAllQuestions}
            />
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
                      <QuestionCard key={question.questionId} question={question} index={index} />
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
            <LearningInsights performance={performance} stats={stats} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}


