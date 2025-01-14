'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Book, Clock, ArrowRight, Trophy, Target, Brain, BarChart } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { CourseProgress as CourseProgressType, UserStats } from "@/app/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CourseProgressProps {
  courses: CourseProgressType[]
  stats: UserStats
}

export default function CourseProgress({ courses, stats }: CourseProgressProps) {
  const [selectedView, setSelectedView] = useState<'list' | 'stats'>('list')

  if (!courses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <Book className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses enrolled yet</p>
          <Button asChild>
            <Link href="/dashboard/courses">Browse Courses</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const completedCourses = courses?.filter(course => course.progress === 100).length
  const totalCourses = courses?.length
  const progressPercentage = totalCourses ? (completedCourses / totalCourses) * 100 : 0

  // Calculate time metrics
  const totalHoursSpent = Math.round(stats.totalTimeSpent / 3600)
  const averageCompletion = courses.reduce((acc, course) => 
    acc + course.progress, 0) / courses.length

  // Generate AI insights
  const getAIInsights = () => {
    const insights = []
    
    if (averageCompletion < 50) {
      insights.push({
        icon: Target,
        message: "Focus on completing current courses before starting new ones",
        type: "recommendation"
      })
    }

    if (stats.averageScore < 70) {
      insights.push({
        icon: Brain,
        message: "Review previous chapters to improve quiz scores",
        type: "improvement"
      })
    }

    if (totalHoursSpent > 20) {
      insights.push({
        icon: Trophy,
        message: "You're in the top 25% of active learners!",
        type: "achievement"
      })
    }

    return insights
  }

  return (
    <Card className="col-span-full md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Course Progress</CardTitle>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="hidden md:inline-flex">
            {completedCourses} of {totalCourses} Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 cursor-help transition-all hover:h-3" 
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete {totalCourses - completedCourses} more courses to reach 100%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs defaultValue="list">
          <div className="flex items-center justify-end mb-4">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{totalHoursSpent}h</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Time Spent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{Math.round(stats.averageScore)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Average Quiz Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{stats.highestScore}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Highest Score</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">AI Insights</h4>
              <div className="grid gap-4">
                {getAIInsights().map((insight, index) => (
                  <div
                    key={`insight-${insight.type}-${index}`}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <insight.icon className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {courses?.map((course, index) => (
                  <Link
                    key={`course-${course.id || index}`}
                    href={`/dashboard/course/${course.course.slug}`}
                    className="group block"
                  >
                    <div className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md">
                        <Image
                          src={course.course.image}
                          alt={course.course.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{course.course.name}</h3>
                          <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            <span>
                              {Math.round(course.progress)}% Complete
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Book className="mr-1 h-4 w-4" />
                            <span>{course.course.category.name}</span>
                          </div>
                        </div>
                        <Progress 
                          value={course.progress} 
                          className="h-1 transition-all group-hover:h-2" 
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
