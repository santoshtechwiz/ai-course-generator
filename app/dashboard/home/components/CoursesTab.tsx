"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle,
  PlusCircle,
  Loader2,
  Grid3X3,
  List,
  Star,
  Users,
  Play,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { DashboardUser, Course } from "@/app/types/types"
import { useGlobalLoader } from "@/store/loaders/global-loader"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CoursesTabProps {
  userData: DashboardUser
}

type ViewMode = "grid" | "list"
type FilterTab = "all" | "in-progress" | "completed" | "favorites"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function CoursesTab({ userData }: CoursesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const router = useRouter()
  const { startLoading } = useGlobalLoader()

  // Memoized course data processing
  const courseData = useMemo(() => {
    const allCourses = userData?.courses || []
    const inProgressCourses = (userData?.courseProgress || [])
      .filter((course) => !course.isCompleted)
      .map((p) => p.course)
      .filter((course): course is Course => Boolean(course))

    const completedCourses = (userData?.courseProgress || [])
      .filter((course) => course.isCompleted)
      .map((p) => p.course)
      .filter((course): course is Course => Boolean(course))

    const favoriteCourses = (userData?.favorites || [])
      .map((fav) => fav.course)
      .filter((course): course is Course => Boolean(course))

    return {
      all: allCourses,
      inProgress: inProgressCourses,
      completed: completedCourses,
      favorites: favoriteCourses,
    }
  }, [userData])

  // Memoized filtered courses
  const filteredCourses = useMemo(() => {
    const courses = courseData[activeTab === "in-progress" ? "inProgress" : activeTab] || []

    if (!searchTerm) return courses

    return courses.filter(
      (course) =>
        course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course?.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [courseData, activeTab, searchTerm])

  const handleCourseClick = useCallback(
    (courseId: string, slug: string) => {
      startLoading({
        message: "Loading course...",
        isBlocking: false,
        id: `course-load-${courseId}`,
      })
      requestAnimationFrame(() => {
        router.push(`/dashboard/course/${slug}`)
      })
    },
    [router, startLoading],
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0"
      >
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">My Courses</h2>
          <p className="text-muted-foreground">Manage and continue your learning journey</p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="shadow-sm">
            <Link href="/dashboard/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Search and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-10 shadow-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
              <Badge variant="secondary" className="ml-1">
                {courseData.all.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">In Progress</span>
              <Badge variant="secondary" className="ml-1">
                {courseData.inProgress.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
              <Badge variant="secondary" className="ml-1">
                {courseData.completed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites</span>
              <Badge variant="secondary" className="ml-1">
                {courseData.favorites.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${viewMode}`}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >
                <CourseGrid
                  courses={filteredCourses}
                  viewMode={viewMode}
                  showProgress={activeTab === "in-progress"}
                  onCourseClick={handleCourseClick}
                  userData={userData}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    </div>
  )
}

interface CourseGridProps {
  courses: Course[]
  viewMode: ViewMode
  showProgress?: boolean
  onCourseClick: (courseId: string, slug: string) => void
  userData: DashboardUser
}

function CourseGrid({ courses, viewMode, showProgress = false, onCourseClick, userData }: CourseGridProps) {
  const { isLoading: isGlobalLoading, loadingId } = useGlobalLoader()

  if (courses.length === 0) {
    return <EmptyState showProgress={showProgress} />
  }

  return (
    <div className={cn(viewMode === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4")}>
      {courses.map((course, index) => {
        const isLoadingThisCourse = isGlobalLoading && loadingId === `course-load-${course.id}`
        const progress = userData.courseProgress?.find((p) => p.course.id === course.id)?.progress || 0

        return (
          <motion.div key={course.id} variants={itemVariants} transition={{ delay: index * 0.05 }}>
            {viewMode === "grid" ? (
              <CourseCard
                course={course}
                progress={showProgress ? progress : undefined}
                isLoading={isLoadingThisCourse}
                onClick={() => onCourseClick(course.id, course.slug)}
              />
            ) : (
              <CourseListItem
                course={course}
                progress={showProgress ? progress : undefined}
                isLoading={isLoadingThisCourse}
                onClick={() => onCourseClick(course.id, course.slug)}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

interface CourseCardProps {
  course: Course
  progress?: number
  isLoading?: boolean
  onClick: () => void
}

function CourseCard({ course, progress, isLoading, onClick }: CourseCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden border-0 shadow-md transition-all duration-300 hover:shadow-xl",
          isLoading && "opacity-70 scale-[0.98]",
        )}
        onClick={onClick}
      >
        {/* Course Image */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={course.image || "/placeholder.svg?height=200&width=400"}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Category Badge */}
          {course.category && (
            <Badge className="absolute left-3 top-3 bg-background/90 text-foreground shadow-sm">
              {course.category.name}
            </Badge>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="rounded-full bg-primary/90 p-3 shadow-lg backdrop-blur-sm">
              <Play className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Title and Description */}
            <div className="space-y-2">
              <h3 className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
            </div>

            {/* Progress Bar */}
            {progress !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Course Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.estimatedHours || "N/A"}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>1.2k</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
                  <DropdownMenuItem>Share Course</DropdownMenuItem>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Completion Badge */}
            {progress === 100 && (
              <Badge className="w-fit bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CourseListItem({ course, progress, isLoading, onClick }: CourseCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md",
        isLoading && "opacity-70",
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Course Image */}
          <div className="relative h-24 w-32 flex-shrink-0 sm:h-32 sm:w-48">
            <Image
              src={course.image || "/placeholder.svg?height=128&width=192"}
              alt={course.title}
              fill
              className="object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {course.category && (
                    <Badge variant="outline" className="text-xs">
                      {course.category.name}
                    </Badge>
                  )}
                  <h3 className="line-clamp-1 text-lg font-semibold group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
                    <DropdownMenuItem>Share Course</DropdownMenuItem>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
            </div>

            <div className="mt-4 space-y-3">
              {/* Progress */}
              {progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-primary">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.estimatedHours || "N/A"}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>1.2k students</span>
                  </div>
                </div>

                {progress === 100 && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ showProgress }: { showProgress: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="rounded-full bg-muted p-6 mb-6">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </div>

      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-xl font-semibold">{showProgress ? "No courses in progress" : "No courses found"}</h3>
        <p className="text-muted-foreground">
          {showProgress
            ? "Start learning today and track your progress as you go."
            : "Try adjusting your search or explore our course catalog."}
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/dashboard/explore">
            <Search className="mr-2 h-4 w-4" />
            Explore Courses
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
