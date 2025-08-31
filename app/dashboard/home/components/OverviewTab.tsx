"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, GraduationCap, BarChart3, Clock, Award, TrendingUp, ArrowRight, CheckCircle2, Target, Lightbulb, Star, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { DashboardUser, UserStats } from "@/app/types/types"
import RecentQuizCard from "./RecentQuizCard"

interface OverviewTabProps {
  userData: DashboardUser
  userStats: UserStats
}

// Memoize the component to prevent unnecessary re-renders
const OverviewTab = memo(function OverviewTab({ userData, userStats }: OverviewTabProps) {
  // Calculate completion rate for use in both insights and stat cards
  const completionRate = useMemo(() => {
    if (!userData) return 0
    const totalCourses = userData.courses?.length || 0
    const completedCourses = userData.courseProgress?.filter(c => c.isCompleted)?.length || 0
    return totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
  }, [userData])

  // Simple insights based on user data
  const insights = useMemo(() => {
    if (!userData || !userStats) return []

    const insights = []
    const avgScore = userStats.averageScore || 0

    if (completionRate < 50) {
      insights.push({
        id: 'low-completion',
        type: 'improvement',
        title: 'Course Completion',
        description: `You've completed ${userData.courseProgress?.filter(c => c.isCompleted)?.length || 0} of ${userData.courses?.length || 0} courses.`,
        priority: 'medium',
      })
    }

    if (avgScore < 70) {
      insights.push({
        id: 'quiz-performance',
        type: 'improvement',
        title: 'Quiz Performance',
        description: `Your average quiz score is ${Math.round(avgScore)}%.`,
        priority: 'medium',
      })
    }

    return insights
  }, [userData, userStats])

  // Simple suggestions
  const suggestions = useMemo(() => {
    if (!userData) return []

    const suggestions = []
    const inProgressCourses = userData.courseProgress?.filter(c => !c.isCompleted) || []

    if (inProgressCourses.length > 0) {
      suggestions.push({
        id: 'continue-course',
        type: 'course',
        title: 'Continue Learning',
        description: `Resume your ${inProgressCourses.length} in-progress course(s)`,
        priority: 'high',
        estimatedTime: 30,
        resourceId: inProgressCourses[0]?.course?.slug || '',
        resourceType: 'course',
      })
    }

    return suggestions
  }, [userData])

  // Recent courses based on course progress
  const recentCourses = useMemo(() => {
    if (!userData?.courseProgress) return []
    
    return userData.courseProgress
      .sort((a, b) => new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime())
      .slice(0, 3) // Show only 3 most recent
  }, [userData])

  // Recent quizzes based on quiz attempts
  const recentQuizzes = useMemo(() => {
    if (!userData?.quizAttempts) return []
    
    return userData.quizAttempts
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3) // Show only 3 most recent
  }, [userData])

  // Recent quiz attempts
  const recentAttempts = useMemo(() => {
    if (!userData?.quizAttempts) return []
    
    return userData.quizAttempts
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3) // Show only 3 most recent
  }, [userData])

  const statCards = [
    {
      title: "Courses",
      value: userData?.courses?.length || 0,
      subtitle: `${userData?.courseProgress?.filter(c => c.isCompleted)?.length || 0} completed`,
      icon: <BookOpen className="h-5 w-5" />,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      progress: userData?.courses?.length ? ((userData?.courseProgress?.filter(c => c.isCompleted)?.length || 0) / userData.courses.length) * 100 : 0
    },
    {
      title: "Quizzes",
      value: userData?.userQuizzes?.length || 0,
      subtitle: `${userData?.quizAttempts?.length || 0} attempts`,
      icon: <GraduationCap className="h-5 w-5" />,
      color: "bg-green-50",
      iconColor: "text-green-600",
      progress: userData?.userQuizzes?.length ? ((userData?.quizAttempts?.length || 0) / userData.userQuizzes.length) * 100 : 0
    },
    {
      title: "Avg. Score",
      value: `${Math.round(userStats?.averageScore || 0)}%`,
      subtitle: `${userStats?.highestScore || 0}% highest`,
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      progress: userStats?.averageScore || 0
    },
    {
      title: "Study Time",
      value: `${Math.round((userStats?.totalTimeSpent || 0) / 60)}h`,
      subtitle: `${userData?.streakDays || 0} day streak`,
      icon: <Clock className="h-5 w-5" />,
      color: "bg-orange-50",
      iconColor: "text-orange-600",
      progress: Math.min(((userData?.streakDays || 0) / 30) * 100, 100) // Max 30 days for progress
    },
    {
      title: "Completion",
      value: `${Math.round(completionRate)}%`,
      subtitle: "overall progress",
      icon: <Target className="h-5 w-5" />,
      color: "bg-teal-50",
      iconColor: "text-teal-600",
      progress: completionRate
    },
    {
      title: "Improvement",
      value: `${Math.round(userStats?.recentImprovement || 0)}%`,
      subtitle: "this month",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-indigo-50",
      iconColor: "text-indigo-600",
      progress: Math.min(Math.abs(userStats?.recentImprovement || 0), 100)
    },
  ]

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
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <div className={stat.iconColor}>
                    {stat.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  <div className="mt-2">
                    <Progress value={stat.progress} className="h-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Courses</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/courses">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCourses.length > 0 ? (
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <Link key={course.id} href={`/dashboard/course/${course.course?.slug}`} className="block">
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                          src={course.course?.image || "/placeholder.svg"}
                          alt={course.course?.title || "Course"}
                          fill
                          className="object-cover"
                          sizes="48px"
                          priority={false}
                          />
                        </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{course.course?.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={course.progress || 0} className="h-2 w-24" />
                          <span className="text-xs text-muted-foreground">{Math.round(course.progress || 0)}% complete</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-2 font-medium">No courses yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Start your learning journey by exploring courses.</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/explore">Explore Courses</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Quizzes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/quizzes">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <RecentQuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-2 font-medium">No quizzes yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Test your knowledge by taking a quiz.</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/quizzes/create">Create Quiz</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quiz Attempts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Quiz Attempts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/quizzes">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentAttempts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAttempts.map((attempt) => (
                <Card key={attempt.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{attempt.userQuiz?.title || "Quiz"}</h3>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (attempt.score || 0) >= 70
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {attempt.score || 0}%
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                      <div className="ml-auto flex items-center">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        <span>{attempt.score || 0}% accuracy</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-2 font-medium">No quiz attempts yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Take a quiz to see your results here.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/quizzes">Browse Quizzes</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div
                  key={insight.id}
                  className={`p-3 border rounded-lg ${
                    insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                    insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className={`h-4 w-4 mt-0.5 ${
                      insight.priority === 'high' ? 'text-red-600' :
                      insight.priority === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={
                      suggestion.priority === 'high' ? 'destructive' :
                      suggestion.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {suggestion.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-50 cursor-not-allowed"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {suggestion.estimatedTime} min
                    </span>
                    <Button asChild size="sm">
                      <Link href={
                        suggestion.resourceType === 'course'
                          ? `/dashboard/course/${suggestion.resourceId}`
                          : `/dashboard/quiz/${suggestion.resourceId}`
                      }>
                        {suggestion.type === 'course' ? 'Resume' :
                         suggestion.type === 'quiz' ? 'Take Quiz' : 'Start'}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

export default OverviewTab
