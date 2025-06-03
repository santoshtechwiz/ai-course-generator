"use client"

import { Button } from "@/components/ui/button"
import { FileQuestion, AlignJustify, PenTool, Code, Filter, X, ChevronDown } from "lucide-react"
import { SearchBar } from "./SearchBar"
import type React from "react"
import { useEffect, useState, memo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export type QuizType = "mcq" | "openended" | "fill-blanks" | "code"

const quizTypes = [
  { id: "mcq" as const, label: "Multiple Choice", icon: FileQuestion, color: "blue" },
  { id: "openended" as const, label: "Open Ended", icon: AlignJustify, color: "green" },
  { id: "fill-blanks" as const, label: "Fill in the Blanks", icon: PenTool, color: "yellow" },
  { id: "code" as const, label: "Code", icon: Code, color: "purple" },
]

interface QuizSidebarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
  selectedTypes: QuizType[]
  toggleQuizType: (type: QuizType) => void
  questionCountRange?: [number, number]
  onQuestionCountChange?: (range: [number, number]) => void
  showPublicOnly?: boolean
  onPublicOnlyChange?: (value: boolean) => void
}

function QuizSidebarComponent({
  search,
  onSearchChange,
  onClearSearch,
  isSearching,
  selectedTypes,
  toggleQuizType,
  questionCountRange = [0, 50],
  onQuestionCountChange,
  showPublicOnly = false,
  onPublicOnlyChange,
}: QuizSidebarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [localQuestionCount, setLocalQuestionCount] = useState<[number, number]>(questionCountRange)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Update local question count when prop changes
  useEffect(() => {
    setLocalQuestionCount(questionCountRange)
  }, [questionCountRange])

  // Handle question count change with debounce
  const handleQuestionCountChange = useCallback(
    (value: number[]) => {
      if (value.length >= 2) {
        setLocalQuestionCount([value[0], value[1]])

        // Debounce the callback to avoid too many updates
        const timer = setTimeout(() => {
          if (onQuestionCountChange) {
            onQuestionCountChange([value[0], value[1]])
          }
        }, 300)

        return () => clearTimeout(timer)
      }
    },
    [onQuestionCountChange],
  )

  // Get color classes based on quiz type
  const getTypeColorClasses = (type: QuizType, isSelected: boolean) => {
    const colorMap: Record<string, string> = {
      mcq: isSelected
        ? "bg-blue-500 text-white hover:bg-blue-600"
        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
      openended: isSelected
        ? "bg-green-500 text-white hover:bg-green-600"
        : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
      "fill-blanks": isSelected
        ? "bg-yellow-500 text-white hover:bg-yellow-600"
        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
      code: isSelected
        ? "bg-purple-500 text-white hover:bg-purple-600"
        : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    }

    return colorMap[type] || (isSelected ? "bg-primary text-white" : "bg-muted text-foreground")
  }

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
    <motion.div
      className="space-y-6 lg:w-1/4 bg-background border rounded-lg p-4 shadow-sm"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Desktop Search */}
      <motion.div className="hidden lg:block" variants={itemVariants}>
        <SearchBar
          search={search}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          isSearching={isSearching}
        />
      </motion.div>

      {/* Mobile Search and Filter Toggle */}
      <motion.div className="lg:hidden space-y-4" variants={itemVariants}>
        <SearchBar
          search={search}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          isSearching={isSearching}
        />

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 border-dashed w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showMobileFilters ? "rotate-180" : ""}`}
            />
            {selectedTypes.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {selectedTypes.length}
              </span>
            )}
          </Button>

          {(selectedTypes.length > 0 || search.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filter Section - Desktop always visible, Mobile conditionally visible */}
      <AnimatePresence>
        {(showMobileFilters || isDesktop) && (
          <motion.div
            className="space-y-4 bg-card p-4 rounded-lg border shadow-sm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div className="flex justify-between items-center" variants={itemVariants}>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filter by Type
              </h3>
              {selectedTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Clear all selected types
                    selectedTypes.forEach((type) => toggleQuizType(type))
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </motion.div>

            <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2" variants={itemVariants}>
              {quizTypes.map((type) => {
                const isSelected = selectedTypes.includes(type.id)
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => toggleQuizType(type.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${getTypeColorClasses(
                      type.id,
                      isSelected,
                    )}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <type.icon className={`h-4 w-4 ${isSelected ? "text-white" : `text-${type.color}-600`}`} />
                    {type.label}
                    {isSelected && (
                      <span className="ml-auto bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </motion.div>

            {/* Question Count Range Filter */}
            {onQuestionCountChange && (
              <motion.div className="pt-4 space-y-3" variants={itemVariants}>
                <Separator className="my-4" />

                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-primary" />
                  Question Count
                </h3>

                <div className="px-2">
                  <Slider
                    min={0}
                    max={50}
                    step={1}
                    value={[localQuestionCount[0], localQuestionCount[1]]}
                    onValueChange={handleQuestionCountChange}
                    className="my-6"
                  />

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{localQuestionCount[0]} questions</span>
                    <span>{localQuestionCount[1]} questions</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Public Only Toggle */}
            {onPublicOnlyChange && (
              <motion.div className="pt-4" variants={itemVariants}>
                <Separator className="my-4" />

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="public-only" className="flex items-center gap-2 cursor-pointer">
                    <Badge variant="outline" className="font-normal">
                      Public
                    </Badge>
                    <span>Show public quizzes only</span>
                  </Label>
                  <Switch id="public-only" checked={showPublicOnly} onCheckedChange={onPublicOnlyChange} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const QuizSidebar = memo(QuizSidebarComponent)

// No changes needed; ensure all quiz types use similar answer/feedback props and UI patterns.
