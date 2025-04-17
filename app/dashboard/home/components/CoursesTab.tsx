"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Clock, CheckCircle, PlusCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { DashboardUser } from "@/app/types/types"

interface CoursesTabProps {
  userData: DashboardUser
}

export default function CoursesTab({ userData }: CoursesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Filter and sort courses
  const allCourses = userData.courses || []
  const inProgressCourses = userData.courseProgress.filter((course) => !course.isCompleted) || []
  const completedCourses = userData.courseProgress.filter((course) => course.isCompleted) || []
  const favoriteCourses = userData.favorites.map((fav) => fav.course) || []

  // Apply search filter
  const filterCourses = (courses: any[]) => {
    if (!searchTerm) return courses

    return courses.filter(
      (course) =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const filteredAllCourses = filterCourses(allCourses)
  const filteredInProgressCourses = filterCourses(inProgressCourses.map((p) => p.course).filter(Boolean))
  const filteredCompletedCourses = filterCourses(completedCourses.map((p) => p.course).filter(Boolean))
  const filteredFavoriteCourses = filterCourses(favoriteCourses)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/course/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Courses ({filteredAllCourses.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({filteredInProgressCourses.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredCompletedCourses.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({filteredFavoriteCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <CourseGrid courses={filteredAllCourses} />
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <CourseGrid courses={filteredInProgressCourses} showProgress />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <CourseGrid courses={filteredCompletedCourses} />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <CourseGrid courses={filteredFavoriteCourses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface CourseGridProps {
  courses: any[]
  showProgress?: boolean
}

function CourseGrid({ courses, showProgress = false }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No courses found</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            {showProgress
              ? "You don't have any courses in progress. Start learning today!"
              : "No courses match your search criteria. Try a different search term."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/explore">Explore Courses</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <Link href={`/dashboard/course/${course.slug}`}>
            <div className="relative h-40 w-full">
              <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
              {course.category && (
                <Badge className="absolute top-2 right-2 bg-black/60 hover:bg-black/70">{course.category.name}</Badge>
              )}
            </div>
          </Link>
          <CardContent className="p-4">
            <Link href={`/dashboard/course/${course.slug}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                {course.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>

            {showProgress && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium">{course.progress || 0}%</span>
                </div>
                <Progress value={course.progress || 0} className="h-2" />
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span>{course.estimatedHours || "N/A"} hours</span>
              </div>
              {course.isCompleted && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
