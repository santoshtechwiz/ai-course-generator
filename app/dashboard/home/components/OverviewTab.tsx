"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, BarChart3, Clock, Award, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react"
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
  const recentCourses =
    userData?.courseProgress
      ?.sort((a, b) => new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime())
      .slice(0, 3) || []

  const recentQuizzes =
    userData?.userQuizzes
      ?.sort((a, b) => {
        const dateA = a.timeEnded || a.timeStarted || new Date()
        const dateB = b.timeEnded || b.timeStarted || new Date()
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      .slice(0, 3) || []

  const recentAttempts =
    userData?.quizAttempts
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) || []

  const statCards = [
    {
      title: "Courses",
      value: userData?.courses?.length || 0,
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Quizzes",
      value: userData?.userQuizzes?.length || 0,
      icon: <GraduationCap className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-500/10",
    },
    {
      title: "Avg. Score",
      value: `${Math.round(userStats?.averageScore || 0)}%`,
      icon: <BarChart3 className="h-5 w-5 text-green-500" />,
      color: "bg-green-500/10",
    },
    {
      title: "Learning Time",
      value: `${Math.round((userStats?.totalTimeSpent || 0) / 60)} min`,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: "bg-amber-500/10",
    },
    {
      title: "Streak",
      value: userData?.streakDays || 0,
      icon: <Award className="h-5 w-5 text-red-500" />,
      color: "bg-red-500/10",
    },
    {
      title: "Improvement",
      value: `${Math.round(userStats?.recentImprovement || 0)}%`,
      icon: <TrendingUp className="h-5 w-5 text-indigo-500" />,
      color: "bg-indigo-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
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
                        <span>{attempt.accuracy || 0}% accuracy</span>
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
    </div>
  )
})

export default OverviewTab
