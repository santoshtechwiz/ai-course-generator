"use client"

/**
 * Learning Analytics Widget - Simplified (No Tabs)
 * 
 * Single-view dashboard showing all key metrics at once:
 * - Weekly stats (quizzes, study time, streak)
 * - Weekly activity chart
 * - Badge progress
 * 
 * This replaces the tabbed version for better UX and less navigation
 */

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Flame, 
  Trophy, 
  BookOpen,
  Clock,
  Zap
} from "lucide-react"
import { useAuth } from "@/hooks"
import { useBadgeNotifications, useStreakNotifications } from "@/hooks/useBadgeNotifications"

interface LearningAnalyticsSimplifiedProps {
  userId: string
  weeklyProgress?: {
    day: string
    quizzes: number
    studyTime: number
  }[]
  streak?: number
  longestStreak?: number
  badgesEarned?: number
  totalBadges?: number
}

export default function LearningAnalyticsSimplified({
  userId,
  weeklyProgress = [],
  streak = 0,
  longestStreak = 0,
  badgesEarned = 0,
  totalBadges = 17
}: LearningAnalyticsSimplifiedProps) {
  const { isAuthenticated } = useAuth()
  
  // Enable badge and streak notifications
  useBadgeNotifications(userId, isAuthenticated)
  useStreakNotifications(userId, isAuthenticated)

  // Calculate weekly stats
  const weeklyQuizzes = weeklyProgress.reduce((sum, day) => sum + day.quizzes, 0)
  const weeklyStudyTime = Math.round(weeklyProgress.reduce((sum, day) => sum + day.studyTime, 0) / 60)
  const badgeProgress = Math.round((badgesEarned / totalBadges) * 100)
  
  // Streak status
  const streakEmoji = streak >= 7 ? "🔥" : streak >= 3 ? "💪" : "🌱"
  const streakText = streak >= 7 ? "On Fire!" : streak >= 3 ? "Building" : "Starting"

  // Max value for chart scaling
  const maxQuizzes = Math.max(...weeklyProgress.map(d => d.quizzes), 1)

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5 text-primary" />
          Learning Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Weekly Quizzes */}
          <div className="bg-primary/5 p-4 rounded-none border-4 border-primary/10 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {weeklyQuizzes}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Quizzes Completed</div>
          </div>

          {/* Study Time */}
          <div className="bg-secondary/5 p-4 rounded-none border-4 border-secondary/10 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Study Time</span>
            </div>
            <div className="text-3xl font-bold text-secondary">
              {weeklyStudyTime}h
            </div>
            <div className="text-xs text-muted-foreground mt-1">This Week</div>
          </div>

          {/* Current Streak */}
          <div className="bg-warning/5 p-4 rounded-none border-4 border-warning/10 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Streak {streakEmoji}</span>
            </div>
            <div className="text-3xl font-bold text-warning">
              {streak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {streakText} • Best: {longestStreak}
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Weekly Activity
            </h4>
          </div>
          <div className="space-y-2">
            {weeklyProgress.map((day, index) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="text-xs font-medium w-8 text-muted-foreground">
                  {day.day}
                </span>
                <div className="flex-1">
                  <Progress 
                    value={(day.quizzes / maxQuizzes) * 100} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {day.quizzes} {day.quizzes === 1 ? 'quiz' : 'quizzes'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Progress */}
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-none border-4 border-yellow-100 dark:border-yellow-900 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <h4 className="font-semibold text-foreground">
                Badge Progress
              </h4>
            </div>
            <Badge variant="secondary" className="bg-warning/20 text-warning">
              {badgesEarned}/{totalBadges}
            </Badge>
          </div>
          <Progress value={badgeProgress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            {badgeProgress}% complete • {totalBadges - badgesEarned} more to unlock
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
