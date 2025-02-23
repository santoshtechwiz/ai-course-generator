"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Book } from "lucide-react"
import type { CourseProgress as CourseProgressType, UserStats } from "@/app/types/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StatsView } from "./StatsView"
import { CourseProgressList } from "./CourseProgressList"


interface CourseProgressProps {
  courses: CourseProgressType[]
  stats: UserStats
}

export default function CourseProgress({ courses, stats }: CourseProgressProps) {
  const [selectedView, setSelectedView] = useState<"list" | "stats">("list")

  if (!courses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <Book className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses enrolled yet</p>
        </CardContent>
      </Card>
    )
  }

  const completedCourses = courses?.filter((course) => course.progress === 100).length
  const totalCourses = courses?.length
  const progressPercentage = totalCourses ? (completedCourses / totalCourses) * 100 : 0

  const handleTabChange = (value: string) => {
    setSelectedView(value as "list" | "stats")
  }

  return (
    <Card className="col-span-full md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Course Progress</CardTitle>
        <Badge variant="secondary" className="hidden md:inline-flex">
          {completedCourses} of {totalCourses} Completed
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress value={progressPercentage} className="h-2 cursor-help transition-all hover:h-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Complete {totalCourses - completedCourses} more courses to reach 100%</p>
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

          <TabsContent value="stats">
            <StatsView stats={stats} />
          </TabsContent>

          <TabsContent value="list">
            <CourseProgressList courses={courses} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

