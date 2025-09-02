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
      // Remove global loader since navigation already handles loading
      router.push(`/dashboard/course/${slug}`)
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
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-11 h-11 shadow-sm bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-border/50 p-1 bg-background/50">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-9 w-9 p-0 rounded-lg transition-all duration-200"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-9 w-9 p-0 rounded-lg transition-all duration-200"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">All</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
                {courseData.all.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">In Progress</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
                {courseData.inProgress.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Completed</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary text-xs">
                {courseData.completed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <Star className="h-4 w-4" />
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
    <div className={cn(viewMode === "grid" ? "grid grid-cols-1 gap-8 md:grid-cols-2 2xl:grid-cols-3 max-w-[1600px] mx-auto" : "space-y-4")}>
      {courses.map((course, index) => {
        const progress = userData.courseProgress?.find((p) => p.course.id === course.id)?.progress || 0

        return (
          <motion.div key={course.id} variants={itemVariants} transition={{ delay: index * 0.05 }}>
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
  const chapterCount = course.courseUnits?.reduce((total, unit) => total + (unit.chapters?.length || 0), 0) || 0;
  const quizCount = course.courseUnits?.reduce((total, unit) => 
    total + (unit.chapters?.reduce((chapterTotal, chapter) => chapterTotal + (chapter.questions?.length || 0), 0) || 0), 0) || 0;
  
  // Calculate total duration from chapters if available
  const totalDuration = course.courseUnits?.reduce((total, unit) => 
    total + (unit.chapters?.reduce((chapterTotal, chapter) => chapterTotal + (typeof chapter.duration === 'number' ? chapter.duration : 0), 0) || 0), 0) || course.estimatedHours;
  
  // Format creation date
  const createdDate = course.createdAt ? new Date(course.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short' 
  }) : null;
  
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }} 
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 15 }}
      className="relative group"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500 group-hover:duration-200" />
      
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden border-0 relative",
          "shadow-lg hover:shadow-2xl transition-all duration-500",
          "ring-1 ring-border/50 hover:ring-primary/30",
          "bg-gradient-to-br from-card/98 via-card/95 to-card/90 backdrop-blur-sm",
          "rounded-xl h-full",
          isLoading && "opacity-70 scale-[0.98]",
        )}
        onClick={onClick}
      >
        {/* Enhanced Course Image Section */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <Image
            src={course.image || "/course.png"}
            alt={course.title}
            fill
            className={cn(
              "object-cover transition-all duration-700 will-change-transform",
              "group-hover:scale-110 group-hover:brightness-105 group-hover:saturate-110"
            )} />

          {/* Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Category Badge */}
          {course.category && (
            <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm border-0 font-medium">
              {typeof course.category === 'object' ? course.category.name : course.category}
            </Badge>
          )}

          {/* Difficulty Level Badge */}
          {course.level && (
            <Badge className="absolute right-3 top-3 bg-secondary/90 text-secondary-foreground shadow-lg backdrop-blur-sm border-0 font-medium">
              {course.level}
            </Badge>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {/* Enhanced Play Button Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="flex justify-between items-start">
              {course.category && (
                <Badge className="bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm border-0 font-medium">
                  {typeof course.category === 'object' ? course.category.name : course.category}
                </Badge>
              )}
              {progress === 100 && (
                <Badge className="bg-emerald-500/90 text-white shadow-lg backdrop-blur-sm border-0">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-center">
              <motion.div 
                className="rounded-full bg-primary shadow-2xl backdrop-blur-sm border border-primary-foreground/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4">
                  <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5 flex-1 flex flex-col">
          {/* Title and Description with Enhanced Typography */}
          <div className="space-y-3">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary transition-colors duration-300">
              {course.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed tracking-wide">
              {course.description}
            </p>
            
            {/* Instructor and Creation Date */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {course.instructor && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.instructor}
                </span>
              )}
              {createdDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {createdDate}
                </span>
              )}
            </div>
          </div>

          {/* Progress Section with Enhanced Visualization */}
          {progress !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-accent/50">
                    <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                  </div>
                  Course Progress
                </span>
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full text-xs shadow-sm"
                >
                  {Math.round(progress)}% Complete
                </motion.span>
              </div>
              <div className="relative h-2.5 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Enhanced Course Stats Grid - 2x3 Layout */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
            {/* Chapters */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="group/stat flex items-center gap-3 text-sm"
            >
              <div className="p-2.5 rounded-xl bg-accent/50 shadow-sm ring-1 ring-border/5 group-hover/stat:ring-primary/20 group-hover/stat:bg-accent transition-all duration-300">
                <BookOpen className="h-4 w-4 text-primary/80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Chapters</span>
                <span className="font-semibold text-foreground">{chapterCount || 'N/A'}</span>
              </div>
            </motion.div>

            {/* Quizzes */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="group/stat flex items-center gap-3 text-sm"
            >
              <div className="p-2.5 rounded-xl bg-accent/50 shadow-sm ring-1 ring-border/5 group-hover/stat:ring-primary/20 group-hover/stat:bg-accent transition-all duration-300">
                <CheckCircle className="h-4 w-4 text-primary/80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Quizzes</span>
                <span className="font-semibold text-foreground">{quizCount || 'N/A'}</span>
              </div>
            </motion.div>

            {/* Duration */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="group/stat flex items-center gap-3 text-sm"
            >
              <div className="p-2.5 rounded-xl bg-accent/50 shadow-sm ring-1 ring-border/5 group-hover/stat:ring-primary/20 group-hover/stat:bg-accent transition-all duration-300">
                <Clock className="h-4 w-4 text-primary/80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Duration</span>
                <span className="font-semibold text-foreground">{totalDuration ? `${totalDuration}h` : (course.estimatedHours ? `${course.estimatedHours}h` : 'N/A')}</span>
              </div>
            </motion.div>

            {/* Students */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="group/stat flex items-center gap-3 text-sm"
            >
              <div className="p-2.5 rounded-xl bg-accent/50 shadow-sm ring-1 ring-border/5 group-hover/stat:ring-primary/20 group-hover/stat:bg-accent transition-all duration-300">
                <Users className="h-4 w-4 text-primary/80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Students</span>
                <span className="font-semibold text-foreground">{course.students ? `${course.students.toLocaleString()}` : 'N/A'}</span>
              </div>
            </motion.div>

            {/* Rating */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="group/stat flex items-center gap-3 text-sm"
            >
              <div className="p-2.5 rounded-xl bg-accent/50 shadow-sm ring-1 ring-border/5 group-hover/stat:ring-primary/20 group-hover/stat:bg-accent transition-all duration-300">
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Rating</span>
                <span className="font-semibold text-foreground">{course.rating ? `${course.rating}/5` : '4.8/5'}</span>
              </div>
            </motion.div>

            {/* Views */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="group/stat flex items-center gap-3 text-sm"
            >
              <div className="p-2.5 rounded-xl bg-accent/50 shadow-sm ring-1 ring-border/5 group-hover/stat:ring-primary/20 group-hover/stat:bg-accent transition-all duration-300">
                <Play className="h-4 w-4 text-primary/80" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Views</span>
                <span className="font-semibold text-foreground">{course.viewCount ? `${course.viewCount.toLocaleString()}` : 'N/A'}</span>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 mt-auto">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs bg-accent/50 hover:bg-accent/80"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle favorite action
                }}
              >
                <Heart className="h-3.5 w-3.5 mr-1" />
                Favorite
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full bg-accent/50 hover:bg-accent/80 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Add to Favorites
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Share Course
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Enhanced Completion Badge */}
          {progress === 100 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Badge className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Completed
              </Badge>
            </motion.div>
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
                      {typeof course.category === 'object' ? course.category.name : course.category}
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
