"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Award, 
  Target, 
  Calendar,
  ArrowRight,
  Play,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"

interface LearningActivityProps {
  recentEvents: Array<{
    id: string
    type: string
    entityId?: string
    progress?: number
    timeSpent?: number
    createdAt: string
    metadata?: any
    course?: { title: string; slug: string }
    chapter?: { title: string; id: number }
  }>
  todayStats: {
    timeSpent: number
    coursesStudied: number
    chaptersCompleted: number
    quizzesCompleted: number
  }
  weeklyStats: {
    timeSpent: number
    coursesStarted: number
    coursesCompleted: number
    averageScore: number
  }
}

const eventTypeConfig = {
  VIDEO_PLAY: { icon: Play, label: "Started video", color: "text-blue-600" },
  VIDEO_COMPLETE: { icon: CheckCircle2, label: "Completed video", color: "text-green-600" },
  QUIZ_START: { icon: Target, label: "Started quiz", color: "text-orange-600" },
  QUIZ_SUBMIT: { icon: Award, label: "Completed quiz", color: "text-purple-600" },
  CHAPTER_COMPLETE: { icon: CheckCircle2, label: "Completed chapter", color: "text-green-600" },
}

function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default function LearningActivity({ recentEvents, todayStats, weeklyStats }: LearningActivityProps) {
  return (
    <div className="space-y-6">
      {/* Today's Learning Stats - Simplified */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{formatTimeSpent(todayStats.timeSpent)}</div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{todayStats.coursesStudied}</div>
              <div className="text-sm text-muted-foreground">Courses Studied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{todayStats.chaptersCompleted}</div>
              <div className="text-sm text-muted-foreground">Chapters Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{todayStats.quizzesCompleted}</div>
              <div className="text-sm text-muted-foreground">Quizzes Taken</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Learning Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.slice(0, 8).map((event) => {
              const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig]
              if (!config) return null

              const Icon = config.icon
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.label}</span>
                      {event.course && (
                        <Badge variant="secondary" className="text-xs">
                          {event.course.title}
                        </Badge>
                      )}
                    </div>
                    {event.chapter && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Chapter: {event.chapter.title}
                      </div>
                    )}
                    {event.timeSpent && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Time: {formatTimeSpent(event.timeSpent)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </div>
                  {event.course && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/courses/${event.course.slug}`}>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          {recentEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent learning activity</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/courses">
                  Start Learning
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
