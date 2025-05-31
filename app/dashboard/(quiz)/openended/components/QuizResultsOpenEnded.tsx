"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Check,
  X,
  Award,
  RefreshCw,
  Home,
  Download,
  Share2,
  Brain,
  BarChart3,
  BookOpen
} from 'lucide-react'

import { 
  selectQuizResults,
  selectQuizTitle,
  resetQuiz
} from '@/store/slices/quizSlice'
import { QuizSubmissionLoading } from '../../components'


interface QuizResultsOpenEndedProps {
  slug: string
  initialResults?: any
  hasResults?: boolean
}

export default function QuizResultsOpenEnded({ 
  slug,
  initialResults,
  hasResults = false
}: QuizResultsOpenEndedProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  
  // Simplified state management - reduce redundant state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  
  // Get quiz results from Redux store just once (outside effects)
  const reduxResults = useSelector(selectQuizResults)
  const quizTitle = useSelector(selectQuizTitle)
  
  // Important - memoize results to prevent unnecessary processing and infinite loops
  const results = useMemo(() => {
    // Priority: initialResults (passed from parent) > reduxResults > null
    return initialResults || reduxResults || null
  }, [initialResults, reduxResults])

  // Check if results exist on first render and set loading accordingly
  useEffect(() => {
    // Simulate loading for smoother UX with shorter timeout
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 400)
    
    return () => clearTimeout(timer)
  }, []) // Empty dependency array - only run once

  
  // Handle retake quiz with memoization to prevent unnecessary recreations
  const handleRetakeQuiz = useCallback(() => {
    dispatch(resetQuiz())
    router.push(`/dashboard/openended/${slug}`)
  }, [dispatch, router, slug])

  // Handle share results with memoization
  const handleShareResults = useCallback(async () => {
    if (!results) return
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${results.title || 'Open-Ended Quiz'} Results`,
          text: `I scored ${results.percentage}% on the ${results.title || 'Open-Ended Quiz'}!`,
          url: window.location.href
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Results link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing results:', error)
    }
  }, [results])

  // Handle sign in navigation
  const handleSignIn = useCallback(() => {
    router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}&fromQuiz=true`)
  }, [router])

  if (isLoading) {
    return <QuizSubmissionLoading quizType="openended" />
  }
  
  // If no results are available, show a message
  if (!results && !hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Brain className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Results Available</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find any results for this quiz. You may need to complete the quiz first.
        </p>
        <Button onClick={() => router.push(`/dashboard/openended/${slug}`)}>
          Start Quiz
        </Button>
      </div>
    )
  }
  
  // Calculate performance metrics from results - move outside render and memoize to prevent re-calculations
  const scorePercentage = results?.percentage || 0
  const correctCount = results?.score || 0
  const totalCount = results?.maxScore || 0
  const incorrectCount = totalCount - correctCount
  
  // Determine performance level - use function instead of IIFE to prevent re-execution on every render
  const getPerformanceBadge = () => {
    if (scorePercentage >= 90) return { label: 'Outstanding', color: 'text-green-600 bg-green-100' }
    if (scorePercentage >= 80) return { label: 'Excellent', color: 'text-blue-600 bg-blue-100' }
    if (scorePercentage >= 70) return { label: 'Good', color: 'text-yellow-600 bg-yellow-100' }
    if (scorePercentage >= 60) return { label: 'Satisfactory', color: 'text-orange-600 bg-orange-100' }
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' }
  }
  
  const performanceBadge = getPerformanceBadge()
  
  // Group questions by correctness - memoize to avoid recalculation on every render
  const correctAnswers = useMemo(() => 
    results?.questions?.filter(q => q.isCorrect) || [], 
    [results?.questions]
  )
  
  const incorrectAnswers = useMemo(() => 
    results?.questions?.filter(q => !q.isCorrect) || [], 
    [results?.questions]
  )

  return (
    <div className="container mx-auto py-8">
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{results?.title || quizTitle || 'Open-Ended Quiz'} Results</h1>
            <p className="text-muted-foreground">
              Completed on {new Date(results?.completedAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
          
          <div className="relative">
            <motion.div 
              className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-foreground text-white text-3xl font-bold"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.8, delay: 0.3 }}
            >
              {scorePercentage}%
            </motion.div>
            <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full ${performanceBadge.color} text-xs font-medium`}>
              {performanceBadge.label}
            </div>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold">{correctCount}/{totalCount}</p>
                    <p className="text-xs text-muted-foreground">correct answers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Brain className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                    <p className="text-2xl font-bold">{correctCount}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((correctCount / (totalCount || 1)) * 100)}% accuracy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="text-2xl font-bold">{performanceBadge.label}</p>
                    <p className="text-xs text-muted-foreground">performance rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Save Results Button - Only show for authenticated users */}
        {isAuthenticated && !isSaved && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <Button 
              onClick={handleSaveResults}
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Save Results to Your Profile</span>
                </>
              )}
            </Button>
          </motion.div>
        )}
        
        {/* Sign In Prompt for Non-Authenticated Users */}
        {!isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-primary/5 border border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Sign in to save your results</h3>
                    <p className="text-muted-foreground">Create an account or sign in to save your progress</p>
                  </div>
                  <Button onClick={handleSignIn}>
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Tabs for Answer Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Tabs defaultValue="summary" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="correct" className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Correct ({correctAnswers.length})
              </TabsTrigger>
              <TabsTrigger value="incorrect" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Incorrect ({incorrectAnswers.length})
              </TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <TabsContent value="summary" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Accuracy</span>
                          <span className="font-medium">{scorePercentage}%</span>
                        </div>
                        <Progress value={scorePercentage} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Correct Answers</p>
                          <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Incorrect Answers</p>
                          <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">Key Insights:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {scorePercentage >= 80 ? (
                            <li>Excellent understanding of the topic.</li>
                          ) : scorePercentage >= 60 ? (
                            <li>Good grasp of the subject with some areas for improvement.</li>
                          ) : (
                            <li>More practice recommended to strengthen your understanding.</li>
                          )}
                          {correctAnswers.length > 0 && (
                            <li>Your strongest answers showed good comprehension.</li>
                          )}
                          {incorrectAnswers.length > 0 && (
                            <li>Review the incorrect answers to improve your understanding.</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="correct" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Correct Answers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {correctAnswers.length > 0 ? (
                        correctAnswers.map((question, i) => (
                          <div key={question.questionId} className="border-l-4 border-green-500 pl-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 p-1 rounded-full bg-green-100">
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="space-y-2 flex-1">
                                <p className="font-medium">{question.question}</p>
                                <div className="text-sm">
                                  <p className="text-muted-foreground">Your answer:</p>
                                  <p className="mt-1 p-2 bg-green-50 dark:bg-green-900/10 rounded">{question.userAnswer}</p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                                    <p>Similarity score: {Math.round((question.similarity || 0) * 100)}%</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <X className="mx-auto h-10 w-10 text-red-500 mb-4" />
                          <p className="text-lg font-medium">No Correct Answers</p>
                          <p className="text-muted-foreground mt-1">Keep practicing to improve your score!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="incorrect" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Incorrect Answers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {incorrectAnswers.length > 0 ? (
                        incorrectAnswers.map((question, i) => (
                          <div key={question.questionId} className="border-l-4 border-red-500 pl-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 p-1 rounded-full bg-red-100">
                                <X className="h-4 w-4 text-red-600" />
                              </div>
                              <div className="space-y-2 flex-1">
                                <p className="font-medium">{question.question}</p>
                                <div className="text-sm">
                                  <p className="text-muted-foreground">Your answer:</p>
                                  <p className="mt-1 p-2 bg-red-50 dark:bg-red-900/10 rounded">{question.userAnswer}</p>
                                  <p className="text-muted-foreground mt-3">Correct answer:</p>
                                  <p className="mt-1 p-2 bg-green-50 dark:bg-green-900/10 rounded">{question.correctAnswer}</p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                                    <p>Similarity score: {Math.round((question.similarity || 0) * 100)}%</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Check className="mx-auto h-10 w-10 text-green-500 mb-4" />
                          <p className="text-lg font-medium">Perfect Score!</p>
                          <p className="text-muted-foreground mt-1">You answered all questions correctly!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
        
        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t"
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/quizzes')} className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleShareResults} className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
          
          <Button onClick={handleRetakeQuiz} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Retry Quiz</span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
