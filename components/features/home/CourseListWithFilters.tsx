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
    <div className="min-h-screen bg-background">
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
