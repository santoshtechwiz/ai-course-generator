"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Clock, Award, TrendingUp, BookOpen, Calendar } from "lucide-react"
import type { UserStats } from "@/app/types/types"

interface UserStatsOverviewProps {
  stats: UserStats
}

export function UserStatsOverview({ stats }: UserStatsOverviewProps) {
  const statItems = [
    {
      icon: Award,
      label: "Highest Score",
      value: `${stats.highestScore.toFixed(1)}%`,
      color: "text-yellow-500",
    },
    {
      icon: TrendingUp,
      label: "Average Score",
      value: `${stats.averageScore.toFixed(1)}%`,
      color: "text-green-500",
    },
    {
      icon: BookOpen,
      label: "Total Quizzes",
      value: stats.totalQuizzes,
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Total Time Spent",
      value: `${Math.round(stats.totalTimeSpent / 60)} mins`,
      color: "text-purple-500",
    },
    {
      icon: Calendar,
      label: "Quizzes per Month",
      value: stats.quizzesPerMonth.toFixed(1),
      color: "text-indigo-500",
    },
    {
      icon: TrendingUp,
      label: "Recent Improvement",
      value: `${stats.recentImprovement.toFixed(1)}%`,
      color: "text-primary",
    },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          Your Learning Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${item.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Top Performing Topics</h3>
          <div className="space-y-3">
            {stats.topPerformingTopics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted/50 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{topic.topic}</span>
                  <span className="text-sm">
                    {topic.averageScore.toFixed(1)}% ({topic.attempts} attempts)
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.averageScore}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

