"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Book, Clock, ArrowRight, Trophy, Target, Brain, BarChart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { CourseProgress as CourseProgressType, UserStats } from "@/app/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
//import { useTrackingContext } from "@/app/providers/TrackingProvider"

interface CourseProgressProps {
  courses: CourseProgressType[]
  stats: UserStats
}

export default function CourseProgress({ courses, stats }: CourseProgressProps) {
  const [selectedView, setSelectedView] = useState<"list" | "stats">("list")
  //const { trackInteraction } = useTrackingContext()

  // useEffect(() => {
  //   trackInteraction("view", "course_progress", "component", {
  //     courseCount: courses.length,
  //     completedCourses: courses.filter((course) => course.progress === 100).length,
  //   })
  // }, [])

  if (!courses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <Book className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses enrolled yet</p>
          <Button asChild onClick={() => trackInteraction("click", "browse_courses", "button")}>
            <Link href="/dashboard/courses">Browse Courses</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const completedCourses = courses?.filter((course) => course.progress === 100).length
  const totalCourses = courses?.length
  const progressPercentage = totalCourses ? (completedCourses / totalCourses) * 100 : 0

  // Calculate time metrics
  const totalHoursSpent = Math.round(stats.totalTimeSpent / 3600)
  const averageCompletion = courses.reduce((acc, course) => acc + course.progress, 0) / courses.length

  // Generate AI insights
  const getAIInsights = () => {
    const insights = []

    if (stats.courseCompletionRate < 50) {
      insights.push({
        icon: Target,
        message: "Try to complete more courses to improve your overall progress",
        type: "recommendation",
      })
    }

    if (stats.averageScore < 70) {
      insights.push({
        icon: Brain,
        message: "Review previous chapters to improve your quiz scores",
        type: "improvement",
      })
    }

    if (stats.consistencyScore < 60) {
      insights.push({
        icon: Clock,
        message: "Maintain a more consistent study schedule to boost your learning",
        type: "consistency",
      })
    }

    if (stats.learningEfficiency > 80) {
      insights.push({
        icon: Trophy,
        message: "Great job! Your learning efficiency is impressive. Keep it up!",
        type: "achievement",
      })
    }

    if (stats.difficultyProgression > 70) {
      insights.push({
        icon: Target,
        message: "You're tackling more challenging content. Consider reviewing fundamentals if needed.",
        type: "challenge",
      })
    }

    return insights
  }

  const handleTabChange = (value: string) => {
    setSelectedView(value as "list" | "stats")
   // trackInteraction("tab_change", "course_progress", "tab", { newView: value })
  }

  const handleCourseClick = (courseId: string, courseName: string) => {
   // trackInteraction("click", "course_item", "link", { courseId, courseName })
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
                <Progress value={progressPercentage} className="h-2 cursor-help transition-all hover:h-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete {totalCourses - completedCourses} more courses to reach 100%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs defaultValue="list" onValueChange={handleTabChange}>
          <div className="flex items-center justify-end mb-4">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{Math.round(stats.courseCompletionRate)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Course Completion Rate</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">Learning Efficiency</h3>
                  <Progress value={stats.learningEfficiency} className="h-2" />
                  <p className="text-sm mt-2">
                    Your learning efficiency score is {Math.round(stats.learningEfficiency)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">Consistency Score</h3>
                  <Progress value={stats.consistencyScore} className="h-2" />
                  <p className="text-sm mt-2">Your consistency score is {Math.round(stats.consistencyScore)}%</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Top Performing Topics</h3>
                <ul className="space-y-2">
                  {stats.topPerformingTopics.map((topic, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span>{topic.topic}</span>
                      <span className="font-semibold">{Math.round(topic.averageScore)}%</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {courses?.map((course, index) => (
                  <Link
                    key={`course-${course.id || index}`}
                    href={`/dashboard/course/${course.course.slug}`}
                    className="group block"
                    onClick={() => handleCourseClick(course.id.toString(), course.course.name)}
                  >
                    <div className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md">
                        <Image
                          src={course.course.image || "/placeholder.svg"}
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
                            <span>{Math.round(course.progress)}% Complete</span>
                          </div>
                          <div className="flex items-center">
                            <Book className="mr-1 h-4 w-4" />
                            <span>{course.course.category?.name || "Uncategorized"}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>Last accessed: {new Date(course.lastAccessedAt).toLocaleDateString()}</span>
                          <span>Time spent: {Math.round(course.timeSpent / 3600)}h</span>
                        </div>
                        <Progress value={course.progress} className="h-1 transition-all group-hover:h-2" />
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

