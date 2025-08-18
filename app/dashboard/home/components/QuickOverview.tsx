"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BarChart3, Clock, Award } from "lucide-react"
import type { DashboardUser, UserStats } from "@/app/types/types"

interface QuickOverviewProps {
  userData: DashboardUser
  userStats: UserStats
  quickStats?: any
}

/**
 * Lightweight overview component for fast initial render
 * Shows only essential information without heavy charts or animations
 */
const QuickOverview = memo(function QuickOverview({ userData, userStats, quickStats }: QuickOverviewProps) {
  const stats = [
    {
      title: "Total Quizzes",
      value: quickStats?.totalQuizzes || userStats.totalQuizzes || 0,
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Average Score",
      value: `${Math.round(quickStats?.averageScore || userStats.averageScore || 0)}%`,
      icon: <BarChart3 className="h-5 w-5 text-green-500" />,
      color: "bg-green-500/10",
    },
    {
      title: "Learning Time",
      value: `${Math.round((quickStats?.totalTimeSpent || userStats.totalTimeSpent || 0))} min`,
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-500/10",
    },
    {
      title: "Current Streak",
      value: userData.streakDays || 0,
      icon: <Award className="h-5 w-5 text-amber-500" />,
      color: "bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userData.name}!</h1>
        <p className="text-muted-foreground mt-2">Here's your learning progress at a glance.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h3 className="font-semibold">Continue Learning</h3>
              <p className="text-sm text-muted-foreground">Resume your last course</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h3 className="font-semibold">Take a Quiz</h3>
              <p className="text-sm text-muted-foreground">Test your knowledge</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h3 className="font-semibold">Browse Courses</h3>
              <p className="text-sm text-muted-foreground">Find new topics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default QuickOverview
