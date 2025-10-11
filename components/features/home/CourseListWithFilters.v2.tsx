"use client"

import { useState, useEffect } from "react"
import { Search, Sparkles, Award, Users, X, BookOpen, Filter, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import CourseList from "./CourseLists"
import type { CategoryId } from "@/config/categories"

interface CourseListWithFiltersProps {
  url: string
  userId?: string
}

export default function CourseListWithFilters({ url, userId }: CourseListWithFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest" | "price-low" | "price-high">("popular")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId as CategoryId | null)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSortBy("popular")
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 800)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true)
      const timer = setTimeout(() => setIsSearching(false), 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const activeFilterCount = [selectedCategory, sortBy !== "popular"].filter(Boolean).length

  const getAnimationVariants = () => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      }
    }
    return {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6 },
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* SVG Pattern */}
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.05]"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="course-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              <rect x="5" y="5" width="2" height="2" fill="currentColor" opacity="0.3" />
              <rect x="13" y="13" width="2" height="2" fill="currentColor" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#course-pattern)" />
        </svg>

        {!shouldReduceMotion && (
          <>
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 60, 0],
                scale: [1, 0.8, 1],
              }}
              transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 5 }}
              className="absolute bottom-32 right-32 w-[500px] h-[500px] bg-gradient-to-r from-green-400/8 to-cyan-400/8 rounded-full blur-3xl"
            />
          </>
        )}

        {!shouldReduceMotion && (
          <>
            <motion.div
              animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute top-40 right-1/4 w-3 h-3 bg-blue-200 dark:bg-blue-900 rounded-full"
            />
            <motion.div
              animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-40 left-1/3 w-2 h-2 bg-purple-200 dark:bg-purple-900 rounded-full"
            />
          </>
        )}
      </div>

      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-br from-background via-background to-primary/5 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hero Content */}
          <motion.div {...getAnimationVariants()} className="text-center space-y-6">
            {/* Badge */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
            >
              <Badge className="mb-4 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white border-0 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI-Powered Learning Platform
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Explore{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Courses
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto text-pretty leading-relaxed">
                Master new skills with expert-led courses designed for your success
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.3 }}
              className="flex flex-wrap justify-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">50k+</span>
                <span className="text-muted-foreground">Learners</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="font-semibold">200+</span>
                <span className="text-muted-foreground">Courses</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-pink-500" />
                <span className="font-semibold">98%</span>
                <span className="text-muted-foreground">Completion Rate</span>
              </div>
            </motion.div>

            {/* Enhanced Search Bar */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
              className="max-w-2xl mx-auto pt-4 md:pt-6 px-4 md:px-0"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative">
                  <Search className="absolute left-3 md:left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5 z-10" />
                  <Input
                    placeholder="Search for courses, topics, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 md:pl-14 pr-12 md:pr-14 h-12 md:h-14 text-base md:text-lg rounded-xl md:rounded-2xl border-2 focus:border-primary shadow-lg bg-background/95 backdrop-blur-sm"
                    aria-label="Search courses"
                  />
                  {isSearching && (
                    <div className="absolute right-12 md:right-14 top-1/2 transform -translate-y-1/2 z-10">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 md:right-5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  )}
                </div>
              </div>

              {!searchQuery && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : 0.6 }}
                  className="mt-3 md:mt-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Popular:</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {["JavaScript", "Python", "React", "Machine Learning", "UI/UX Design"].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setSearchQuery(topic)}
                        className="px-3 py-1.5 text-xs font-medium bg-muted/50 hover:bg-muted rounded-full transition-colors whitespace-nowrap touch-manipulation flex-shrink-0"
                        aria-label={`Search for ${topic} courses`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {(selectedCategory || sortBy !== "popular" || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-center gap-2 pt-2"
              >
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1.5 pr-1">
                    Search: "{searchQuery.slice(0, 20)}
                    {searchQuery.length > 20 ? "..." : ""}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      aria-label="Remove search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1.5 pr-1">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      aria-label="Remove category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {sortBy !== "popular" && (
                  <Badge variant="secondary" className="gap-1.5 pr-1">
                    Sort: {sortBy === "rating" ? "Highest Rated" : sortBy === "newest" ? "Newest" : sortBy}
                    <button
                      onClick={() => setSortBy("popular")}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      aria-label="Remove sort filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                  Clear all
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="shadow-lg h-12 px-6 rounded-full bg-primary text-primary-foreground"
          aria-label="Toggle filters"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-background text-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground"
              aria-label="Scroll to top"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative">
        <CourseList
          url={url}
          userId={userId}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          showMobileFilters={showMobileFilters}
          onCloseMobileFilters={() => setShowMobileFilters(false)}
        />
      </div>
    </div>
  )
}
