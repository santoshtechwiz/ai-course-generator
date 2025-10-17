"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "lucide-react"
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns"

interface DailyReview {
  date: string
  count: number
}

export function ReviewCalendar({ userId }: { userId?: string }) {
  const { data: stats } = useQuery({
    queryKey: ['flashcard-stats', userId, 90],
    queryFn: async () => {
      const response = await fetch('/api/flashcards/stats?days=90')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: !!userId,
  })

  const dailyReviews: DailyReview[] = stats?.dailyReviews || []

  // Create a map for quick lookup
  const reviewMap = new Map(
    dailyReviews.map((r) => [r.date, r.count])
  )

  // Generate last 90 days
  const today = startOfDay(new Date())
  const startDate = subDays(today, 89) // 90 days including today
  const days = eachDayOfInterval({ start: startDate, end: today })

  // Calculate max count for color intensity
  const maxCount = Math.max(...dailyReviews.map((r) => r.count), 1)

  // Group days by week
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  days.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-muted/30 dark:bg-muted/10'
    const ratio = count / maxCount
    if (ratio >= 0.75) return 'bg-green-600 dark:bg-green-500'
    if (ratio >= 0.5) return 'bg-green-500 dark:bg-green-400'
    if (ratio >= 0.25) return 'bg-green-400 dark:bg-green-300'
    return 'bg-green-300 dark:bg-green-200'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          90-Day Review Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="inline-flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const count = reviewMap.get(dateStr) || 0
                      const intensity = getIntensity(count)

                      return (
                        <Tooltip key={dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-primary ${intensity}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-semibold">
                                {format(day, 'MMM d, yyyy')}
                              </p>
                              <p className="text-muted-foreground">
                                {count === 0
                                  ? 'No reviews'
                                  : `${count} review${count > 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30 dark:bg-muted/10" />
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-200" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-300" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400" />
                <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
              </div>
              <span>More</span>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {dailyReviews.length}
                </p>
                <p className="text-xs text-muted-foreground">Active Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalReviews || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {dailyReviews.length > 0
                    ? Math.round(
                        dailyReviews.reduce((sum, r) => sum + r.count, 0) /
                          dailyReviews.length
                      )
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground">Avg per Day</p>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
