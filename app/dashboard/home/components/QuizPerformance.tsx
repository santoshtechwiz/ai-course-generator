"use client"

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
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { getSafeQuizHref } from '@/utils/navigation'

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

export default function QuizPerformance({ data }: QuizPerformanceProps) {
  const inProgressQuizzes = data.quizProgresses.filter(qp => !qp.isCompleted)
  
  return (
    <div className="space-y-6">
      {/* Performance Overview Stats - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(data.performanceStats.averageScore)}%</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
                <div className={`text-xs mt-1 ${data.performanceStats.improvementRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.performanceStats.improvementRate > 0 ? '+' : ''}{data.performanceStats.improvementRate.toFixed(1)}% this week
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.performanceStats.completedQuizzes}/{data.performanceStats.totalQuizzes}</div>
                <div className="text-sm text-muted-foreground">Quizzes Completed</div>
                <Progress value={(data.performanceStats.completedQuizzes / data.performanceStats.totalQuizzes) * 100} className="mt-2 h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.performanceStats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {data.performanceStats.bestStreak} days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Quizzes */}
      {inProgressQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Continue Quiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressQuizzes.slice(0, 4).map((quizProgress) => (
                <div key={quizProgress.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-sm">{quizProgress.quiz?.title || 'Untitled Quiz'}</h3>
                      <p className="text-xs text-muted-foreground">Quiz • {quizProgress.quiz?.questionCount || 0} questions</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">{quizProgress.progress}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Best Score: {quizProgress.bestScore}%
                      </div>
                    </div>
                    <Button className="w-full" size="sm" asChild>
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
      )}

      {/* Recent Quiz Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentAttempts.slice(0, 6).map((attempt) => (
              <div key={attempt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className={`p-2 rounded-full ${attempt.score >= 75 ? 'bg-green-100' : attempt.score >= 60 ? 'bg-orange-100' : 'bg-red-100'}`}>
                  {attempt.score >= 75 ? (
                    <Award className="h-4 w-4 text-green-600" />
                  ) : (
                    <Target className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{attempt.quiz.title}</span>
                    <Badge variant="secondary" className={`text-xs ${getQuizTypeColor(attempt.quiz.quizType)}`}>
                      {attempt.quiz.quizType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Score: <span className={`font-medium ${getScoreColor(attempt.score)}`}>{attempt.score}%</span></span>
                    <span>Accuracy: {Math.round(attempt.accuracy)}%</span>
                    <span>Time: {formatTimeSpent(attempt.timeSpent)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(attempt.createdAt).toLocaleDateString()}
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={getSafeQuizHref('quiz', attempt.quiz.slug)}>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      {data.weakAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.weakAreas.slice(0, 4).map((area, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{area.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getScoreColor(area.averageScore)}`}>
                          {Math.round(area.averageScore)}%
                        </span>
                        {area.improvement !== 0 && (
                          <Badge variant={area.improvement > 0 ? "default" : "destructive"} className="text-xs">
                            {area.improvement > 0 ? '+' : ''}{area.improvement.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={area.averageScore} className="h-2 mb-2" />
                    <div className="text-xs text-muted-foreground">
                      {area.attempts} attempt{area.attempts !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Practice
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
