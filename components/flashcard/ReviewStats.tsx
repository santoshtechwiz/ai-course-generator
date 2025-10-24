"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { neo } from "@/components/neo/tokens"
import { Brain, Target, Clock, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ReviewStatsProps {
  userId?: string
}

export function ReviewStats({ userId }: ReviewStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['flashcard-stats', userId],
    queryFn: async () => {
      const response = await fetch('/api/flashcards/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: !!userId,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Learning Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mastered Cards */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
            <Brain className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <p className="text-3xl font-black text-green-700 dark:text-green-300">
              {stats.masteredCount}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Mastered</p>
            <Badge variant="neutral" className={cn(neo.badge, "mt-2 bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30")}>
              ✓ Learned
            </Badge>
          </div>

          {/* Learning Cards */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
            <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
              {stats.learningCount}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Learning</p>
            <Badge variant="neutral" className={cn(neo.badge, "mt-2 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30")}>
              ⚡ In Progress
            </Badge>
          </div>

          {/* Due Today */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/20">
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
            <p className="text-3xl font-black text-orange-700 dark:text-orange-300">
              {stats.dueCount}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Due Today</p>
            <Badge variant="neutral" className={cn(neo.badge, "mt-2 bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30")}>
              📅 Ready
            </Badge>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Reviews Completed</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalReviews}</p>
        </div>
      </CardContent>
    </Card>
  )
}
