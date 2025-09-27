"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, GraduationCap, BarChart3, Clock, Award, TrendingUp, ArrowRight, CheckCircle2, Target, Star, Play, Zap } from "lucide-react"
import Link from "next/link"
import type { DashboardUser, UserStats } from "@/app/types/types"
import RecentQuizCard from "./RecentQuizCard"
import { getImageWithFallback } from '@/utils/image-utils'
// Quiz recommendations removed from overview to simplify home page
import { getSafeQuizHref, getBestQuizHref } from '@/utils/navigation'

interface OverviewTabProps {
  userData: DashboardUser
  userStats: UserStats
}

// Memoize the component to prevent unnecessary re-renders
const OverviewTab = memo(function OverviewTab({ userData, userStats }: OverviewTabProps) {
  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!userData || !userStats) return {
      coursesInProgress: 0,
      avgScore: 0,
      studyStreak: 0,
      totalTime: 0
    }

    return {
      coursesInProgress: userData.courseProgress?.filter(c => !c.isCompleted)?.length || 0,
      avgScore: Math.round(userStats.averageScore || 0),
      studyStreak: userData.streakDays || 0,
      totalTime: Math.round((userStats.totalTimeSpent || 0) / 60) // Convert to hours
    }
  }, [userData, userStats])

  // Get next action item (most important)
  const nextAction = useMemo(() => {
    if (!userData) return null

    const inProgressCourses = userData.courseProgress?.filter(c => !c.isCompleted) || []

    if (inProgressCourses.length > 0) {
      const mostRecent = inProgressCourses.sort((a, b) =>
        new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime()
      )[0]

      return {
        type: 'course',
        title: 'Continue Learning',
        description: `Resume "${mostRecent.course?.title}" (${Math.round(mostRecent.progress || 0)}% complete)`,
        action: 'Continue',
        link: `/dashboard/course/${mostRecent.course?.slug}`,
        icon: <Play className="h-5 w-5" />,
        priority: 'high'
      }
    }

    // If no in-progress courses, suggest starting a new one
    return {
      type: 'explore',
      title: 'Start Learning',
      description: 'Explore available courses and begin your learning journey',
      action: 'Browse Courses',
      link: '/dashboard/courses',
      icon: <BookOpen className="h-5 w-5" />,
      priority: 'medium'
    }
  }, [userData])

  // Get current learning items (merged courses and quizzes)
  const currentLearning = useMemo(() => {
    if (!userData) return []

    const items: { id: string; type: string; title: string; progress?: number; image: string; link: string; lastAccessed: string; score?: number }[] = []

    // Add in-progress courses
    const inProgressCourses = userData.courseProgress?.filter(c => !c.isCompleted) || []
    inProgressCourses.slice(0, 2).forEach(course => {
      items.push({
        id: `course-${course.id}`,
        type: 'course',
        title: course.course?.title || 'Untitled Course',
        progress: course.progress || 0,
        image: getImageWithFallback(course.course?.image),
        link: `/dashboard/course/${course.course?.slug}`,
        lastAccessed: course.lastAccessedAt
      })
    })

    // Add recent quiz attempts
    const recentQuizzes = userData.quizAttempts?.slice(0, 2) || []
    recentQuizzes.forEach(quiz => {
      const href = getBestQuizHref({ slug: quiz.userQuiz?.slug, type: quiz.userQuiz?.type, id: quiz.userQuiz?.id ?? quiz.id })
      items.push({
        id: `quiz-${quiz.id}`,
        type: 'quiz',
        title: quiz.userQuiz?.title || 'Untitled Quiz',
        score: quiz.score || 0,
        image: '/quiz-placeholder.svg', // Could be improved with actual quiz images
        link: href,
        lastAccessed: quiz.createdAt
      })
    })

    // Sort by last accessed and limit to 4 items
    return items
      .sort((a, b) => new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime())
      .slice(0, 4)
  }, [userData])

  // Early return if no data is available
  if (!userData || !userStats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics - Clean and focused */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses in Progress</p>
                <p className="text-2xl font-bold">{keyMetrics.coursesInProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{keyMetrics.avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold">{keyMetrics.studyStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Learned</p>
                <p className="text-2xl font-bold">{keyMetrics.totalTime}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Action - Primary Focus */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Next Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextAction && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {nextAction.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{nextAction.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nextAction.description}
                  </p>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href={nextAction.link}>
                  {nextAction.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Learning - Merged courses and quizzes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Learning
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/courses">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentLearning.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentLearning.map((item) => (
                <Link key={item.id} href={item.link} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-md transition-all">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-muted/10 flex items-center justify-center">
                      {item.type === 'course' ? (
                        <BookOpen className="h-6 w-6 text-primary" />
                      ) : (
                        <GraduationCap className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {item.type === 'course' ? (
                          <>
                            <Progress value={item.progress} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(item.progress || 0)}%
                            </span>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Score: {item.score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Ready to start learning?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore our courses and begin your journey
              </p>
              <Button asChild>
                <Link href="/dashboard/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Summary - Consolidated from separate tab */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {userData.courses?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userData.courseProgress?.filter(c => c.isCompleted)?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(userStats.averageScore || 0)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {userData.streakDays || 0}
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

  {/* Quiz Recommendations removed */}
    </div>
  )
})

export default OverviewTab
