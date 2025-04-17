"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Award, TrendingUp, Clock, Target, BookOpen } from "lucide-react"
import type { UserStats, UserQuizAttempt } from "@/app/types/types"

interface StatsTabProps {
  userStats: UserStats
  quizAttempts: UserQuizAttempt[]
}

export default function StatsTab({ userStats, quizAttempts }: StatsTabProps) {
  // Prepare data for charts with null checks
  const topicPerformanceData =
    userStats?.topPerformingTopics?.map((topic) => ({
      name: topic.topic || "Unknown",
      score: topic.averageScore || 0,
      attempts: topic.attempts || 0,
    })) || []

  // Prepare score progression data with null checks
  const scoreProgressionData =
    quizAttempts
      ?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((attempt, index) => ({
        name: `Attempt ${index + 1}`,
        score: attempt.score || 0,
        date: new Date(attempt.createdAt).toLocaleDateString(),
      })) || []

  // Prepare quiz type distribution data with null checks
  const quizTypeDistribution =
    quizAttempts?.reduce(
      (acc, attempt) => {
        const quizType = attempt.userQuiz?.quizType || "unknown"
        acc[quizType] = (acc[quizType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  const quizTypeData = Object.entries(quizTypeDistribution).map(([name, value]) => ({
    name,
    value,
  }))

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  const statCards = [
    {
      title: "Total Quizzes",
      value: userStats?.totalQuizzes || 0,
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Average Score",
      value: `${Math.round(userStats?.averageScore || 0)}%`,
      icon: <Target className="h-5 w-5 text-green-500" />,
      color: "bg-green-500/10",
    },
    {
      title: "Highest Score",
      value: `${Math.round(userStats?.highestScore || 0)}%`,
      icon: <Award className="h-5 w-5 text-amber-500" />,
      color: "bg-amber-500/10",
    },
    {
      title: "Total Time",
      value: `${Math.round((userStats?.totalTimeSpent || 0) / 60)} min`,
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-500/10",
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="distribution">Quiz Types</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Score"]}
                      labelFormatter={(label) => `Topic: ${label}`}
                    />
                    <Bar dataKey="score" fill="#8884d8" name="Average Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Score Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreProgressionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Score"]}
                      labelFormatter={(name, entry) => `${entry[0].payload.date}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quizTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {quizTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Attempts"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
