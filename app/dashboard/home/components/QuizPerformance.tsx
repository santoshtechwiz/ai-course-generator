"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Target, 
  Award, 
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Play,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Info
} from "lucide-react"
import Link from "next/link"
import { getSafeQuizHref } from '@/utils/navigation'
import { motion } from "framer-motion"

interface QuizPerformanceData {
  recentAttempts: Array<{
    id: string
    quizId: string
    score: number
    accuracy: number
    timeSpent: number
    createdAt: string
    quiz: {
      title: string
      slug: string
      quizType: string
      questionCount: number
    }
  }>
  quizProgresses: Array<{
    id: string
    quizId: number
    progress: number
    isCompleted: boolean
    bestScore: number
    attempts: number
    lastAttemptAt: string
    quiz: {
      title: string
      slug: string
      difficulty: string
      questionCount: number
    }
  }>
  performanceStats: {
    totalQuizzes: number
    completedQuizzes: number
    averageScore: number
    averageAccuracy: number
    totalTimeSpent: number
    bestStreak: number
    currentStreak: number
    improvementRate: number
  }
  weakAreas: Array<{
    topic: string
    averageScore: number
    attempts: number
    improvement: number
  }>
}

interface QuizPerformanceProps {
  data: QuizPerformanceData
}

function formatTimeSpent(seconds: number): string {
  if (!seconds) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function getQuizTypeColor(quizType: string) {
  switch (quizType.toLowerCase()) {
    case 'mcq': return 'bg-blue-100 text-blue-800'
    case 'openended': return 'bg-purple-100 text-purple-800'
    case 'code': return 'bg-green-100 text-green-800'
    case 'blanks': return 'bg-orange-100 text-orange-800'
    case 'flashcard': return 'bg-pink-100 text-pink-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

function getTimeManagementTip(averageTimePerQuestion: number) {
  if (averageTimePerQuestion < 10) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      tip: "You're moving too quickly through questions. Try to spend at least 30 seconds per question for better results.",
      color: "text-red-600"
    }
  }
  if (averageTimePerQuestion < 30) {
    return {
      icon: <Info className="w-4 h-4 text-orange-500" />,
      tip: "Consider spending more time reviewing each question. Most successful learners take 30-60 seconds per question.",
      color: "text-orange-600"
    }
  }
  if (averageTimePerQuestion > 120) {
    return {
      icon: <Info className="w-4 h-4 text-blue-500" />,
      tip: "You're being thorough! Remember to manage time effectively in timed quizzes.",
      color: "text-blue-600"
    }
  }
  return {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    tip: "Great time management! You're taking enough time to think through each question.",
    color: "text-green-600"
  }
}

export default function QuizPerformance({ data }: QuizPerformanceProps) {
  const {
    recentAttempts,
    performanceStats,
    weakAreas,
    quizProgresses
  } = data

  // Calculate average time per question for recent attempts
  const avgTimePerQuestion = useMemo(() => {
    if (recentAttempts.length === 0) return 0
    const totalTime = recentAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0)
    const totalQuestions = recentAttempts.reduce((sum, attempt) => sum + attempt.quiz.questionCount, 0)
    return totalTime / totalQuestions
  }, [recentAttempts])

  // Get time management guidance
  const timeManagementTip = getTimeManagementTip(avgTimePerQuestion)
  
  const inProgressQuizzes = quizProgresses.filter(qp => !qp.isCompleted)
  
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${performanceStats.averageScore >= 75 ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <Target className={`h-6 w-6 ${getScoreColor(performanceStats.averageScore)}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(performanceStats.averageScore)}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                  <div className={`text-xs mt-1 ${performanceStats.improvementRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceStats.improvementRate > 0 ? '+' : ''}{performanceStats.improvementRate.toFixed(1)}% this week
                  </div>
                  <Progress value={performanceStats.averageScore} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="w-full">
                  <div className="text-2xl font-bold">{performanceStats.completedQuizzes}/{performanceStats.totalQuizzes}</div>
                  <div className="text-sm text-muted-foreground">Quizzes Completed</div>
                  <Progress 
                    value={(performanceStats.completedQuizzes / performanceStats.totalQuizzes) * 100} 
                    className="mt-2"
                  />
                  {timeManagementTip && (
                    <div className="flex items-center gap-1 mt-2 text-xs">
                      {timeManagementTip.icon}
                      <span className={timeManagementTip.color}>
                        Avg. {Math.round(avgTimePerQuestion)}s per question
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{performanceStats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Best: {performanceStats.bestStreak} days
                  </div>
                  {performanceStats.currentStreak > 0 && (
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">
                      🔥 On Fire!
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* In Progress Quizzes */}
      {inProgressQuizzes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-500" />
                Continue Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgressQuizzes.slice(0, 4).map((quizProgress) => (
                  <div 
                    key={quizProgress.id} 
                    className="group relative border rounded-lg p-4 hover:shadow-lg transition-all hover:border-blue-200 bg-card"
                  >
                    <div className="absolute -top-1 -right-1">
                      {quizProgress.progress > 75 ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-0">
                          Almost Done!
                        </Badge>
                      ) : quizProgress.progress > 0 ? (
                        <Badge variant="default" className="bg-blue-100 text-blue-800 border-0">
                          In Progress
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-orange-100 text-orange-800 border-0">
                          Just Started
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                          {quizProgress.quiz?.title || 'Untitled Quiz'}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Quiz • {quizProgress.quiz?.questionCount || 0} questions</span>
                          {quizProgress.quiz?.difficulty && (
                            <Badge variant="secondary" className="text-[10px]">
                              {quizProgress.quiz.difficulty}
                            </Badge>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{quizProgress.progress}%</span>
                          </div>
                          <Progress value={quizProgress.progress} className="h-1.5" />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Best Score</span>
                          <span className={`font-medium ${getScoreColor(quizProgress.bestScore)}`}>
                            {quizProgress.bestScore}%
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors" 
                        size="sm" 
                        variant="outline"
                        asChild
                      >
                        <Link href={`/dashboard/courses/${quizProgress.quiz?.slug || 'untitled'}`}>
                          Continue Quiz <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Quiz Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="space-y-4">
              {recentAttempts.slice(0, 6).map((attempt) => (
                <div
                  key={attempt.id}
                  className="group relative flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:border-blue-200"
                >
                  <div className={`shrink-0 p-3 rounded-full ${
                    attempt.score >= 90 ? 'bg-green-100' :
                    attempt.score >= 75 ? 'bg-blue-100' :
                    attempt.score >= 60 ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    {attempt.score >= 90 ? (
                      <Award className={`h-5 w-5 text-green-600`} />
                    ) : attempt.score >= 75 ? (
                      <Award className={`h-5 w-5 text-blue-600`} />
                    ) : attempt.score >= 60 ? (
                      <Target className={`h-5 w-5 text-orange-600`} />
                    ) : (
                      <AlertTriangle className={`h-5 w-5 text-red-600`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                        {attempt.quiz.title}
                      </h4>
                      <Badge variant="secondary" className={`shrink-0 ${getQuizTypeColor(attempt.quiz.quizType)}`}>
                        {attempt.quiz.quizType.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        <span className={getScoreColor(attempt.score)}>{Math.round(attempt.score)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{Math.round(attempt.accuracy)}% accuracy</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTimeSpent(attempt.timeSpent)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="group-hover:bg-blue-600 group-hover:text-white transition-colors" 
                      asChild
                    >
                      <Link href={getSafeQuizHref(attempt.quiz.quizType, attempt.quiz.slug)}>
                        Try Again <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>

                  {attempt.score === 0 && attempt.timeSpent < 10 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]"
                    >
                      Incomplete Attempt
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Areas for Improvement */}
      {weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="p-6 pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakAreas.slice(0, 4).map((area, index) => (
                  <div 
                    key={index} 
                    className="group relative p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:border-blue-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                          {area.topic}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={area.improvement > 0 ? "default" : "destructive"} 
                            className="text-[10px]"
                          >
                            {area.improvement > 0 ? '+' : ''}{area.improvement.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Current Score</span>
                            <span className={`font-medium ${getScoreColor(area.averageScore)}`}>
                              {Math.round(area.averageScore)}%
                            </span>
                          </div>
                          <Progress 
                            value={area.averageScore} 
                            className="h-1.5"
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{area.attempts} attempt{area.attempts !== 1 ? 's' : ''}</span>
                          {area.averageScore < 60 ? (
                            <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800">
                              Needs Work
                            </Badge>
                          ) : area.averageScore < 75 ? (
                            <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-800">
                              Getting Better
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800">
                              Almost There
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors" 
                        size="sm" 
                        variant="outline"
                      >
                        Practice Topic <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
