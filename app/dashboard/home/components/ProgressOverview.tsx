"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Clock, 
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getImageWithFallback } from '@/utils/image-utils'

interface CourseProgressData {
  id: string
  courseId: number
  progress: number
  timeSpent: number
  isCompleted: boolean
  lastAccessedAt: string
  course: {
    id: number
    title: string
    slug: string
    image?: string
    difficulty?: string
    estimatedHours?: number
  }
}

interface ProgressOverviewProps {
  courseProgresses: CourseProgressData[]
  chapterProgresses: Array<{
    id: string
    courseId: number
    chapterId: number
    progress: number
    isCompleted: boolean
    timeSpent: number
    lastAccessedAt: string
    course: { title: string; slug: string }
    chapter: { title: string; videoUrl?: string }
  }>
  overallStats: {
    totalCourses: number
    completedCourses: number
    totalChapters: number
    completedChapters: number
    totalTimeSpent: number
    averageProgress: number
    streak: number
  }
}

function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function getDifficultyColor(difficulty?: string) {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return 'bg-success/10 text-success border-success/20'
    case 'intermediate': return 'bg-warning/10 text-warning border-warning/20'
    case 'advanced': return 'bg-destructive/10 text-destructive border-destructive/20'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

export default function ProgressOverview({ courseProgresses, chapterProgresses, overallStats }: ProgressOverviewProps) {
  const inProgressCourses = courseProgresses.filter(cp => !cp.isCompleted && cp.progress > 0)
  const recentlyAccessedCourses = courseProgresses
    .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Overall Progress Stats - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{overallStats.completedCourses}/{overallStats.totalCourses}</div>
                <div className="text-sm text-muted-foreground">Courses Completed</div>
                <Progress value={(overallStats.completedCourses / overallStats.totalCourses) * 100} className="mt-2 h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{overallStats.completedChapters}/{overallStats.totalChapters}</div>
                <div className="text-sm text-muted-foreground">Chapters Done</div>
                <Progress value={(overallStats.completedChapters / overallStats.totalChapters) * 100} className="mt-2 h-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatTimeSpent(overallStats.totalTimeSpent)}</div>
                <div className="text-sm text-muted-foreground">Total Learning Time</div>
                <div className="text-xs text-green-600 mt-1">+2h this week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Continue Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.slice(0, 3).map((courseProgress) => (
              <div key={courseProgress.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={getImageWithFallback(courseProgress.course.image)}
                      alt={courseProgress.course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">{courseProgress.course.title}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">{Math.round(courseProgress.progress * 100)}%</span>
                      </div>
                      <Progress value={courseProgress.progress * 100} className="h-1" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatTimeSpent(courseProgress.timeSpent)} spent</span>
                        {courseProgress.course.difficulty && (
                          <Badge variant="secondary" className={`text-xs ${getDifficultyColor(courseProgress.course.difficulty)}`}>
                            {courseProgress.course.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm" asChild>
                  <Link href={`/dashboard/courses/${courseProgress.course.slug}`}>
                    Continue Learning <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          {inProgressCourses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courses in progress</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/courses">
                  Browse Courses
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Chapter Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Chapter Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chapterProgresses.slice(0, 5).map((chapterProgress) => (
              <div key={chapterProgress.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className={`p-2 rounded-full ${chapterProgress.isCompleted ? 'bg-success/10' : 'bg-primary/10'}`}>
                  {chapterProgress.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{chapterProgress.chapter.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {chapterProgress.course.title}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {chapterProgress.isCompleted ? 'Completed' : 'In Progress'} • {formatTimeSpent(chapterProgress.timeSpent)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(chapterProgress.lastAccessedAt).toLocaleDateString()}
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/dashboard/courses/${chapterProgress.course.slug}`}>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
