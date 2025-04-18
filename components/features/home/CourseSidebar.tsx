"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, AArrowUpIcon as SortAscending, ChevronDown, X, Clock, BookOpen, Star, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { categories } from "@/config/categories"
import { cn } from "@/lib/utils"

interface CourseSidebarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  selectedCategories: string[]
  toggleCategory: (category: string) => void
  difficultyLevel: string[]
  toggleDifficulty: (difficulty: string) => void
  durationRange: [number, number]
  onDurationChange: (range: [number, number]) => void
  sortOption: string
  onSortChange: (option: string) => void
  isSearching: boolean
}

export function CourseSidebar({
  search,
  onSearchChange,
  onClearSearch,
  selectedCategories,
  toggleCategory,
  difficultyLevel,
  toggleDifficulty,
  durationRange,
  onDurationChange,
  sortOption,
  onSortChange,
  isSearching,
}: CourseSidebarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [localDuration, setLocalDuration] = useState<[number, number]>(durationRange)
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    difficulty: true,
    duration: true,
    sort: true,
  })

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(typeof window !== "undefined" && window.innerWidth >= 1024) // Ensure consistent rendering
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Update local duration when prop changes
  useEffect(() => {
    setLocalDuration(durationRange)
  }, [durationRange])

  // Handle duration change with debounce
  const handleDurationChange = useCallback(
    (value: number[]) => {
      setLocalDuration([value[0], value[1]])

      // Debounce the callback to avoid too many updates
      const timer = setTimeout(() => {
        onDurationChange([value[0], value[1]])
      }, 300)

      return () => clearTimeout(timer)
    },
    [onDurationChange],
  )

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const difficulties = [
    { id: "Beginner", label: "Beginner", color: "green" },
    { id: "Intermediate", label: "Intermediate", color: "yellow" },
    { id: "Advanced", label: "Advanced", color: "red" },
  ]

  const sortOptions = [
    { id: "popular", label: "Most Popular", icon: Eye },
    { id: "newest", label: "Newest First", icon: Clock },
    { id: "oldest", label: "Oldest First", icon: Clock },
    { id: "rating", label: "Highest Rated", icon: Star },
    { id: "title-asc", label: "Title A-Z", icon: SortAscending },
    { id: "title-desc", label: "Title Z-A", icon: SortAscending },
  ]

  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div className="space-y-6 lg:w-1/4" variants={sidebarVariants} initial="hidden" animate="visible">
      {/* Search Input */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={onSearchChange}
            className="pl-10 pr-10 py-2"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Mobile Filter Toggle */}
      <motion.div className="lg:hidden" variants={itemVariants}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            {showMobileFilters ? "Hide Filters" : "Show Filters"}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${showMobileFilters ? "rotate-180" : ""}`}
          />
        </Button>
      </motion.div>

      {/* Filters Section */}
      <AnimatePresence>
        {(showMobileFilters || isDesktop) && (
          <motion.div
            className="space-y-6 bg-card p-4 rounded-lg border shadow-sm lg:shadow-none lg:p-0"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Categories Section */}
            <Collapsible
              open={expandedSections.categories}
              onOpenChange={() => toggleSection("categories")}
              className="space-y-2"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Categories
                </h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${expandedSections.categories ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategories?.includes(category.id)
                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-all duration-200",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted",
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <category.icon className="h-3 w-3" />
                        <span className="truncate">{category.name}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Difficulty Section */}
            <Collapsible
              open={expandedSections.difficulty}
              onOpenChange={() => toggleSection("difficulty")}
              className="space-y-2"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Difficulty
                </h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${expandedSections.difficulty ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((difficulty) => {
                    const isSelected = difficultyLevel.includes(difficulty.id)
                    return (
                      <motion.button
                        key={difficulty.id}
                        onClick={() => toggleDifficulty(difficulty.id)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                          isSelected
                            ? `bg-${difficulty.color}-500 text-white`
                            : `bg-${difficulty.color}-50 text-${difficulty.color}-700 hover:bg-${difficulty.color}-100 border-${difficulty.color}-200`,
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {difficulty.label}
                      </motion.button>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Duration Range Section */}
            <Collapsible
              open={expandedSections.duration}
              onOpenChange={() => toggleSection("duration")}
              className="space-y-2"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Duration (hours)
                </h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${expandedSections.duration ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="px-2">
                  <Slider
                    defaultValue={[localDuration[0], localDuration[1]]}
                    max={20}
                    step={1}
                    value={[localDuration[0], localDuration[1]]}
                    onValueChange={(value) => handleDurationChange([value[0], value[1]])}
                    className="my-6"
                  />

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{localDuration[0]} hours</span>
                    <span>{localDuration[1]} hours</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Sort Options Section */}
            <Collapsible open={expandedSections.sort} onOpenChange={() => toggleSection("sort")} className="space-y-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <SortAscending className="h-4 w-4 text-primary" />
                  Sort By
                </h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${expandedSections.sort ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="space-y-1">
                  {sortOptions.map((option) => {
                    const isSelected = sortOption === option.id
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => onSortChange(option.id)}
                        className={cn(
                          "flex items-center w-full gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </motion.button>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Reset Filters Button */}
            {isSearching && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Button variant="outline" size="sm" onClick={onClearSearch} className="w-full mt-4">
                  <X className="h-4 w-4 mr-2" />
                  Reset All Filters
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
