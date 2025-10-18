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
