"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Award, 
  BookOpen, 
  Zap,
  Target,
  Calendar,
  PlayCircle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import type { DashboardUser } from "@/app/types/types"

interface OverviewTabProps {
  userData: DashboardUser
}

export default function OverviewTab({ userData }: OverviewTabProps) {
  const totalQuizzes = userData?.userQuizzes?.length || 0
  const completedQuizzes = userData?.userQuizzes?.filter(quiz => quiz.timeEnded)?.length || 0
  const quizAttempts = userData?.quizAttempts?.length || 0
  const avgScore = quizAttempts > 0 ? 
    Math.round((userData?.quizAttempts?.reduce((sum, attempt) => sum + (attempt.score || 0), 0) || 0) / quizAttempts) : 0

  const recentQuizzes = userData?.userQuizzes?.slice(0, 3) || []
  const recentAttempts = userData?.quizAttempts?.slice(0, 3) || []

  const getQuizTypeColor = (quizType: string) => {
    switch (quizType) {
      case "mcq":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "openended":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "blanks":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      case "code":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "flashcard":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {userData?.name || 'Learner'}! 👋
          </h1>
          <p className="text-blue-100 mb-4">
            Ready to continue your learning journey? Let's see what you can achieve today!
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start New Quiz
            </Button>
          </Link>
        </div>
        <div className="absolute top-0 right-0 opacity-20">
          <Brain className="h-32 w-32" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                <p className="text-2xl font-bold">{totalQuizzes}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedQuizzes}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quiz Attempts</p>
                <p className="text-2xl font-bold">{quizAttempts}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No quizzes created yet</p>
                <Link href="/dashboard">
                  <Button variant="outline" className="mt-2">
                    Create Your First Quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">{quiz.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getQuizTypeColor(quiz.quizType)} variant="secondary" size="sm">
                          {quiz.quizType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {quiz.timeEnded ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/${quiz.quizType}/${quiz.slug}`}>
                      <Button variant="outline" size="sm">
                        {quiz.timeEnded ? 'Review' : 'Continue'}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No quiz attempts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete a quiz to see your results here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-1">
                        {attempt.userQuiz?.title || 'Quiz'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-medium ${getScoreColor(attempt.score || 0)}`}>
                          {attempt.score || 0}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {Math.floor((attempt.timeSpent || 0) / 60)}m {((attempt.timeSpent || 0) % 60)}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <Brain className="h-4 w-4 mr-2" />
                Create MCQ Quiz
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Open-Ended Quiz
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Fill in Blanks
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Flashcards
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Learning Streak (if we have user engagement data) */}
      {userData?.streakDays !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-600">{userData.streakDays}</p>
                <p className="text-sm text-muted-foreground">Days in a row</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {userData.streakDays > 0 ? 'Keep it up!' : 'Start your learning streak today!'}
                </p>
                {userData.lastStreakDate && (
                  <p className="text-xs text-muted-foreground">
                    Last activity: {new Date(userData.lastStreakDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
