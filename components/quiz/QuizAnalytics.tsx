"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Brain, 
  Award, 
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizAnalyticsProps {
  quizData: {
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedQuestions: number
    hintsUsed: number
    timeSpent: number
    difficulty: string
    quizType: string
    category: string
  }
  performanceHistory?: Array<{
    date: string
    score: number
    timeSpent: number
    category: string
  }>
  showComparison?: boolean
  className?: string
}

interface PerformanceMetric {
  label: string
  value: number
  total: number
  icon: React.ElementType
  color: string
  description: string
}

export function QuizAnalytics({ 
  quizData, 
  performanceHistory = [], 
  showComparison = true,
  className 
}: QuizAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [animationComplete, setAnimationComplete] = useState(false)

  const {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    skippedQuestions,
    hintsUsed,
    timeSpent,
    difficulty,
    quizType,
    category
  } = quizData

  // Calculate derived metrics
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  const completionRate = totalQuestions > 0 ? ((correctAnswers + incorrectAnswers) / totalQuestions) * 100 : 0
  const averageTimePerQuestion = totalQuestions > 0 ? timeSpent / totalQuestions : 0
  const hintUsageRate = totalQuestions > 0 ? (hintsUsed / totalQuestions) * 100 : 0

  // Performance level calculation
  const getPerformanceLevel = (accuracy: number): { level: string; color: string; description: string } => {
    if (accuracy >= 90) return { 
      level: "Excellent", 
      color: "text-emerald-600", 
      description: "Outstanding performance!" 
    }
    if (accuracy >= 80) return { 
      level: "Good", 
      color: "text-blue-600", 
      description: "Well done!" 
    }
    if (accuracy >= 70) return { 
      level: "Average", 
      color: "text-amber-600", 
      description: "Good effort, room for improvement" 
    }
    if (accuracy >= 60) return { 
      level: "Below Average", 
      color: "text-orange-600", 
      description: "Consider reviewing the material" 
    }
    return { 
      level: "Needs Improvement", 
      color: "text-red-600", 
      description: "Additional practice recommended" 
    }
  }

  const performanceLevel = getPerformanceLevel(accuracy)

  // Metrics configuration
  const metrics: PerformanceMetric[] = [
    {
      label: "Accuracy",
      value: accuracy,
      total: 100,
      icon: Target,
      color: "text-emerald-600",
      description: "Percentage of correct answers"
    },
    {
      label: "Completion",
      value: completionRate,
      total: 100,
      icon: CheckCircle,
      color: "text-blue-600",
      description: "Percentage of questions attempted"
    },
    {
      label: "Efficiency",
      value: Math.max(0, 100 - hintUsageRate),
      total: 100,
      icon: Zap,
      color: "text-purple-600",
      description: "Independent problem solving"
    },
    {
      label: "Speed",
      value: Math.max(0, Math.min(100, (60 / averageTimePerQuestion) * 10)),
      total: 100,
      icon: Clock,
      color: "text-amber-600",
      description: "Answer speed rating"
    }
  ]

  // Historical comparison
  const getHistoricalAverage = (metric: string): number => {
    if (performanceHistory.length === 0) return 0
    const sum = performanceHistory.reduce((acc, entry) => acc + entry.score, 0)
    return sum / performanceHistory.length
  }

  const historicalAverage = getHistoricalAverage("score")
  const improvement = accuracy - historicalAverage

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Header with overall performance */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
              <Award className={cn("w-8 h-8", performanceLevel.color)} />
              Quiz Performance
            </CardTitle>
            <div className="space-y-2">
              <Badge 
                variant="outline" 
                className={cn("text-lg px-4 py-2 font-semibold", performanceLevel.color)}
              >
                {performanceLevel.level}
              </Badge>
              <p className="text-muted-foreground">{performanceLevel.description}</p>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-600">{correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{incorrectAnswers}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">{skippedQuestions}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{Math.round(accuracy)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>

            {/* Improvement indicator */}
            {showComparison && performanceHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-4 p-3 bg-background rounded-lg border"
              >
                <div className="flex items-center justify-center gap-2">
                  {improvement > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-600">
                        +{improvement.toFixed(1)}% improvement from average
                      </span>
                    </>
                  ) : improvement < 0 ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-600">
                        {improvement.toFixed(1)}% below your average
                      </span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">
                        Right on your average performance
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Breakdown
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <metric.icon className={cn("w-5 h-5", metric.color)} />
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {Math.round(metric.value)}%
                      </Badge>
                    </div>
                    
                    <Progress 
                      value={animationComplete ? metric.value : 0} 
                      className="h-2 mb-2"
                    />
                    
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Question Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm">Correct</span>
                    </div>
                    <span className="font-medium">{correctAnswers}/{totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Incorrect</span>
                    </div>
                    <span className="font-medium">{incorrectAnswers}/{totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm">Skipped</span>
                    </div>
                    <span className="font-medium">{skippedQuestions}/{totalQuestions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Time</span>
                    <span className="font-medium">
                      {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg per Question</span>
                    <span className="font-medium">
                      {averageTimePerQuestion.toFixed(1)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hints Used</span>
                    <span className="font-medium">{hintsUsed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Personalized insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Learning Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accuracy >= 90 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-800">
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">
                        🎉 Excellent work! You've mastered this topic. Consider challenging yourself with harder questions or exploring advanced concepts.
                      </p>
                    </div>
                  )}
                  
                  {accuracy < 70 && hintsUsed < totalQuestions * 0.3 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        💡 Don't hesitate to use hints when you're stuck! They're designed to help you learn, not just solve problems.
                      </p>
                    </div>
                  )}
                  
                  {averageTimePerQuestion < 30 && accuracy < 80 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        ⏱️ You're working quite quickly. Try taking more time to carefully read and analyze each question.
                      </p>
                    </div>
                  )}
                  
                  {skippedQuestions > totalQuestions * 0.2 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950/20 dark:border-purple-800">
                      <p className="text-sm text-purple-800 dark:text-purple-300">
                        🎯 You skipped quite a few questions. Consider reviewing the material and trying again to improve your confidence.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quiz metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Type</span>
                    <p className="font-medium capitalize">{quizType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Difficulty</span>
                    <p className="font-medium capitalize">{difficulty}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Category</span>
                    <p className="font-medium">{category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}