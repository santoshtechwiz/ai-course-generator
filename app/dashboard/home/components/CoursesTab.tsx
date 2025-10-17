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
import { StatCard } from "@/components/dashboard/StatCard"
import { 
  cardVariants, 
  staggerContainerVariants, 
  staggerItemVariants,
  badgeVariants,
  fadeInUp
} from "@/utils/animation-utils"

interface CoursesTabProps {
  userData: DashboardUser
}

type ViewMode = "grid" | "list"
type FilterTab = "all" | "in-progress" | "completed" | "favorites"

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
      {/* Quick Stats Overview */}
      <motion.div
        {...fadeInUp(0.1)}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Enrolled"
          value={courseData.all.length}
          icon={BookOpen}
          variant="default"
        />
        <StatCard
          label="In Progress"
          value={courseData.inProgress.length}
          icon={Clock}
          variant="primary"
          description={courseData.inProgress.length > 0 ? "Continue learning" : "All caught up!"}
        />
        <StatCard
          label="Completed"
          value={courseData.completed.length}
          icon={CheckCircle}
          variant="success"
          description={`${courseData.completed.length} courses finished`}
        />
        <StatCard
          label="Favorites"
          value={courseData.favorites.length}
          icon={Heart}
          variant="warning"
          description={courseData.favorites.length > 0 ? "Your top picks" : "Star courses you love"}
        />
      </motion.div>

      {/* Search and Controls (sticky) */}
      <motion.div
        {...fadeInUp(0.15)}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 py-4 px-1 rounded-lg shadow-sm"
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
      <motion.div {...fadeInUp(0.2)}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FilterTab)}
          aria-label="Course filter tabs"
        >
          <TabsList
            className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted/30 p-1 rounded-xl backdrop-blur-sm"
            role="tablist"
          >
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              role="tab"
              aria-selected={activeTab === "all"}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">All</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs font-semibold">
                  {courseData.all.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              role="tab"
              aria-selected={activeTab === "in-progress"}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">In Progress</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs font-semibold">
                  {courseData.inProgress.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              role="tab"
              aria-selected={activeTab === "completed"}
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">Completed</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs font-semibold">
                  {courseData.completed.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              role="tab"
              aria-selected={activeTab === "favorites"}
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">Favorites</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs font-semibold">
                  {courseData.favorites.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${viewMode}`}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={staggerContainerVariants}
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
        // ALWAYS show progress for all courses (not just in-progress)
        const courseProgress = userData.courseProgress?.find((p) => p.course.id === course.id)
        const progress = courseProgress?.progress || 0

        return (
          <motion.div 
            key={course.id} 
            variants={staggerItemVariants} 
            transition={{ delay: index * 0.02 }} 
            role="gridcell"
          >
            {viewMode === "grid" ? (
              <CourseCard
                course={course}
                progress={progress}
                isLoading={false}
                onClick={() => onCourseClick(course.id, course.slug)}
              />
            ) : (
              <CourseListItem
                course={course}
                progress={progress}
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
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      className="relative group h-full"
    >
      <Card
        className={cn(
          "cursor-pointer border border-border/50",
          "shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300",
          "bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm",
          "rounded-2xl h-full flex items-center justify-center overflow-hidden",
          "group-hover:ring-2 group-hover:ring-primary/10",
          isLoading && "opacity-70",
        )}
        onClick={onClick}
      >
        <CardContent className="p-6 flex items-center justify-center flex-col gap-4 text-center relative">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm group-hover:shadow-md transition-shadow duration-300">
            {course.category ? (
              (() => {
                const cat = typeof course.category === 'object' && course.category?.name ? String(course.category.name) : String(course.category)
                const categoryId = cat ? cat.toLowerCase() : ''
                return (
                  <CategoryIcon
                    categoryId={categoryId}
                    size="lg"
                    variant="default"
                  />
                )
              })()
            ) : (
              <BookOpen className="h-7 w-7" />
            )}
          </div>

          <div className="relative space-y-2 w-full">
            <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {course.title}
            </h3>
            
            {course.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {course.description}
              </p>
            )}
          </div>
          
          {/* Display progress if available */}
          {progress !== undefined && progress > 0 && (
            <div className="w-full space-y-2 relative">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2 bg-muted" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                />
              </div>
            </div>
          )}
          
          {/* Metadata */}
          {(chapterCount > 0 || totalDuration) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground w-full justify-center opacity-70 group-hover:opacity-100 transition-opacity">
              {chapterCount > 0 && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {chapterCount} chapters
                </span>
              )}
              {totalDuration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {totalDuration}h
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CourseListItem({ course, progress, isLoading, onClick }: CourseCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-150",
        isLoading && "opacity-70",
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
          {course.category ? (
            (() => {
              const cat = typeof course.category === 'object' && course.category?.name ? String(course.category.name) : String(course.category)
              const categoryId = cat ? cat.toLowerCase() : ''
              return (
                <CategoryIcon categoryId={categoryId} size="sm" variant="default" />
              )
            })()
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground line-clamp-1">{course.title}</h3>
          
          {/* Display progress if available */}
          {progress !== undefined && progress > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          )}
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
