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
  GraduationCap,
  Heart,
  Share2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { DashboardUser, Course } from "@/app/types/types"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getImageWithFallback } from "@/utils/image-utils"
import { CategoryIcon } from "@/app/category-icon"

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
      if (slug) {
        // Remove global loader since navigation already handles loading
        router.push(`/dashboard/course/${slug}`)
      }
    },
    [router],
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
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            My Courses
          </h2>
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

      {/* Search and Controls (sticky) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b py-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-11 h-11 shadow-sm bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search courses by title, description, or category"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced View Mode Toggle */}
          <div
            className="flex items-center rounded-xl border border-border/50 p-1 bg-background/50"
            role="group"
            aria-label="Course view mode"
          >
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 w-9 p-0 rounded-lg transition-all duration-200"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3X3 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 w-9 p-0 rounded-lg transition-all duration-200"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FilterTab)}
          aria-label="Course filter tabs"
        >
          <TabsList
            className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted/30 p-1 rounded-xl"
            role="tablist"
          >
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              role="tab"
              aria-selected={activeTab === "all"}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">All</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
                {courseData.all.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              role="tab"
              aria-selected={activeTab === "in-progress"}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">In Progress</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
                {courseData.inProgress.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              role="tab"
              aria-selected={activeTab === "completed"}
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">Completed</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
                {courseData.completed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              role="tab"
              aria-selected={activeTab === "favorites"}
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">Favorites</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
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
  if (courses.length === 0) {
    return <EmptyState showProgress={showProgress} />
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-[1800px] mx-auto"
          : "space-y-3",
      )}
      role="grid"
      aria-label={`${viewMode === "grid" ? "Grid" : "List"} view of courses`}
    >
      {courses.map((course, index) => {
        const progress = userData.courseProgress?.find((p) => p.course.id === course.id)?.progress || 0

        return (
          <motion.div key={course.id} variants={itemVariants} transition={{ delay: index * 0.03 }} role="gridcell">
            {viewMode === "grid" ? (
              <CourseCard
                course={course}
                progress={showProgress ? progress : undefined}
                isLoading={false}
                onClick={() => onCourseClick(course.id, course.slug)}
              />
            ) : (
              <CourseListItem
                course={course}
                progress={showProgress ? progress : undefined}
                isLoading={false}
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
  // Calculate course statistics with fallback values
  const chapterCount = course.courseUnits?.reduce((total, unit) => total + (unit.chapters?.length || 0), 0) || 0

  // Calculate total duration from estimated hours
  const totalDuration = course.estimatedHours

  // Format creation date
  const createdDate = course.createdAt
    ? new Date(course.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      className="relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition duration-500" />

      <Card
        className={cn(
          "group cursor-pointer overflow-hidden border-0 relative",
          "shadow-lg hover:shadow-2xl transition-all duration-500",
          "ring-1 ring-border/30 hover:ring-primary/30",
          "bg-card/80 backdrop-blur-sm",
          "rounded-2xl h-full",
          isLoading && "opacity-70 scale-[0.98]",
        )}
        onClick={onClick}
      >
        <div className="relative aspect-[5/3] overflow-hidden rounded-t-2xl">
          <Image
            src={getImageWithFallback(course.image) || "/api/placeholder"}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {course.category && (
              <div className="flex items-center gap-2">
                <CategoryIcon
                  categoryId={
                    typeof course.category === "object"
                      ? course.category.name.toLowerCase()
                      : course.category?.toLowerCase()
                  }
                  size="sm"
                  variant="gradient"
                  animated
                />
                <Badge className="bg-white/90 text-gray-900 shadow-lg backdrop-blur-sm border-0 text-xs font-semibold px-3 py-1.5">
                  {typeof course.category === "object" ? course.category.name : course.category}
                </Badge>
              </div>
            )}
            {progress === 100 && (
              <Badge className="bg-emerald-500/95 text-white shadow-lg backdrop-blur-sm border-0 text-xs font-semibold px-3 py-1.5">
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Completed
              </Badge>
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
            <motion.div
              className="rounded-full bg-primary/95 backdrop-blur-sm p-4 shadow-2xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="h-6 w-6 text-primary-foreground ml-1" />
            </motion.div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="space-y-3">
            <h3 className="line-clamp-2 text-lg font-bold leading-tight group-hover:text-primary transition-colors duration-300 text-balance">
              {course.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed text-pretty">
              {course.description}
            </p>
          </div>

          {(course.instructor || createdDate) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {course.instructor && (
                <span className="flex items-center gap-2 truncate">
                  <div className="p-1.5 rounded-lg bg-accent/20">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="truncate font-medium">{course.instructor}</span>
                </span>
              )}
              {createdDate && (
                <span className="flex items-center gap-2 flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{createdDate}</span>
                </span>
              )}
            </div>
          )}

          {progress !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold">Progress</span>
                <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full text-xs">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative h-2.5 bg-muted/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/50 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-foreground">{chapterCount || "N/A"}</span>
                <span className="text-xs">chapters</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <span className="font-semibold text-foreground">{totalDuration ? `${totalDuration}h` : "N/A"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {course.students ? `${course.students.toLocaleString()}` : "1.2k"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-semibold text-foreground">{course.rating ? `${course.rating}` : "4.8"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-auto">
            <div className="flex items-center gap-2">
              {course.level && (
                <Badge variant="outline" className="text-xs px-3 py-1 font-medium border-primary/30 text-primary">
                  {course.level}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle favorite action
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer text-sm">
                    <Heart className="h-4 w-4 mr-3" /> Add to Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-sm">
                    <Share2 className="h-4 w-4 mr-3" /> Share Course
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-sm">
                    <BookOpen className="h-4 w-4 mr-3" /> View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
              src={course.image || "/api/placeholder?height=128&width=192"}
              alt={course.title}
              fill
              className="object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-6 w-6 text-primary" />
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
                      {typeof course.category === "object" ? course.category.name : course.category}
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
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary/60" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
          <PlusCircle className="h-4 w-4 text-accent-foreground" />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-md">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            {showProgress ? "No courses in progress" : "Your learning journey starts here"}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {showProgress
              ? "Ready to start learning? Browse our course catalog and begin your educational adventure."
              : "Discover amazing courses tailored to your interests. Start building your knowledge today."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/dashboard/explore" className="gap-2">
              <Search className="h-4 w-4" />
              {showProgress ? "Browse Courses" : "Explore Courses"}
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/dashboard/create" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        {!showProgress && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Popular categories to get you started:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Web Development", "Data Science", "Mobile Apps", "AI & Machine Learning"].map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
