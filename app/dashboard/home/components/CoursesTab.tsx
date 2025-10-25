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
import { cn, getColorClasses } from "@/lib/utils"
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
  
  // Get Neobrutalism utility classes
  const { inputText, buttonIcon, badgeCount, cardPrimary } = getColorClasses()

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
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          "sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
          "py-4"
        )}
      >
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search courses..."
            className={cn(
              inputText,
              "pl-11 h-11"
            )}
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search courses by title, description, or category"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced View Mode Toggle */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg border-2 border-border p-1 bg-background",
              "shadow-[2px_2px_0px_0px_hsl(var(--border))]"
            )}
            role="group"
            aria-label="Course view mode"
          >
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-9 w-9 p-0 rounded-md transition-all duration-100",
                viewMode === "grid" && "bg-main text-main-foreground shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid3X3 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-9 w-9 p-0 rounded-md transition-all duration-100",
                viewMode === "list" && "bg-main text-main-foreground shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
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
            className={cn(
              "grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4",
              "bg-secondary/50 p-1.5 rounded-lg",
              "border-2 border-border",
              "shadow-[2px_2px_0px_0px_hsl(var(--border))]"
            )}
            role="tablist"
          >
            <TabsTrigger
              value="all"
              className={cn(
                "flex items-center gap-2 rounded-md transition-all duration-100 font-bold",
                "data-[state=active]:bg-background data-[state=active]:text-foreground",
                "data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
              role="tab"
              aria-selected={activeTab === "all"}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">All</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge 
                  variant="secondary" 
                  className="ml-1 bg-background text-foreground border-2 border-border text-xs font-black px-1.5 py-0.5"
                >
                  {courseData.all.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className={cn(
                "flex items-center gap-2 rounded-lg transition-all duration-100 font-bold",
                "data-[state=active]:bg-main data-[state=active]:text-main-foreground",
                "data-[state=active]:border-2 data-[state=active]:border-border",
                "data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
              role="tab"
              aria-selected={activeTab === "in-progress"}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">In Progress</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge 
                  variant="secondary" 
                  className="ml-1 bg-background text-foreground border-2 border-border text-xs font-black px-1.5 py-0.5"
                >
                  {courseData.inProgress.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={cn(
                "flex items-center gap-2 rounded-lg transition-all duration-100 font-bold",
                "data-[state=active]:bg-main data-[state=active]:text-main-foreground",
                "data-[state=active]:border-2 data-[state=active]:border-border",
                "data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
              role="tab"
              aria-selected={activeTab === "completed"}
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Completed</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge 
                  variant="secondary" 
                  className="ml-1 bg-background text-foreground border-2 border-border text-xs font-black px-1.5 py-0.5"
                >
                  {courseData.completed.length}
                </Badge>
              </motion.div>
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className={cn(
                "flex items-center gap-2 rounded-lg transition-all duration-100 font-bold",
                "data-[state=active]:bg-main data-[state=active]:text-main-foreground",
                "data-[state=active]:border-2 data-[state=active]:border-border",
                "data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              )}
              role="tab"
              aria-selected={activeTab === "favorites"}
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Favorites</span>
              <motion.div variants={badgeVariants} initial="hidden" animate="visible">
                <Badge 
                  variant="secondary" 
                  className="ml-1 bg-background text-foreground border-2 border-border text-xs font-black px-1.5 py-0.5"
                >
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
    
  // Get Neobrutalism utility classes
  const { cardPrimary, badgeStatus, iconContainer } = getColorClasses()

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
          cardPrimary,
          "cursor-pointer transition-all duration-100",
          "hover:shadow-[8px_8px_0px_0px_hsl(var(--border))]",
          "hover:translate-y-[-4px]",
          "h-full flex items-center justify-center overflow-hidden",
          isLoading && "opacity-70",
        )}
        onClick={onClick}
      >
        <CardContent className="p-6 flex flex-col gap-4 text-center relative h-full">
          
          <div className={cn(
            iconContainer,
            "relative mx-auto w-16 h-16 rounded-xl",
            "shadow-[3px_3px_0px_0px_hsl(var(--border))]",
            "group-hover:shadow-[4px_4px_0px_0px_hsl(var(--border))]",
            "transition-all duration-100"
          )}>
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

          <div className="relative space-y-2 flex-1 flex flex-col justify-center min-h-[4rem]">
            <h3 className="text-base font-black leading-tight text-foreground line-clamp-2">
              {course.title}
            </h3>
            
            {course.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                {course.description}
              </p>
            )}
          </div>
          
          {/* Progress section - always present for consistent height */}
          <div className="w-full space-y-2 relative min-h-[3rem] flex flex-col justify-center">
            {progress !== undefined && progress > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-bold">Progress</span>
                  <span className="font-black text-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="relative">
                  <div className="h-3 bg-background border-3 border-border rounded-md overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-main"
                    />
                  </div>
                </div>
              </>
            ) : (
              // Placeholder for consistent height when no progress
              <div className="h-8" />
            )}
          </div>
          
          {/* Metadata section - always present for consistent height */}
          <div className="flex items-center justify-center text-xs text-muted-foreground w-full min-h-[2rem]">
            {(chapterCount > 0 || totalDuration) ? (
              <div className="flex items-center gap-3 font-bold">
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
            ) : (
              // Placeholder for consistent height when no metadata
              <div className="h-6" />
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
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
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
