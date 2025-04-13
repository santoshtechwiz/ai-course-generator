"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { FileQuestion, AlignJustify, PenTool, Code, Flashlight, Filter, X, ChevronDown } from "lucide-react"
import { SearchBar } from "./SearchBar"
type QuizType = "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
import type React from "react"
import { useEffect, useState } from "react"

const quizTypes = [
  { id: "mcq" as const, label: "Multiple Choice", icon: FileQuestion, color: "blue" },
  { id: "openended" as const, label: "Open Ended", icon: AlignJustify, color: "green" },
  { id: "fill-blanks" as const, label: "Fill in the Blanks", icon: PenTool, color: "yellow" },
  { id: "code" as const, label: "Code", icon: Code, color: "purple" },
  { id: "flashcard" as const, label: "Flash Card", icon: Flashlight, color: "pink" },
]

interface QuizSidebarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
  selectedTypes: QuizType[]
  toggleQuizType: (type: QuizType) => void
}

export function QuizSidebar({
  search,
  onSearchChange,
  onClearSearch,
  isSearching,
  selectedTypes,
  toggleQuizType,
}: QuizSidebarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    // Run on mount and add event listener
    handleResize()
    window.addEventListener("resize", handleResize)

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters)
  }

  // Get color classes based on quiz type
  const getTypeColorClasses = (type: QuizType, isSelected: boolean) => {
    const colorMap = {
      mcq: isSelected
        ? "bg-blue-500 text-white hover:bg-blue-600"
        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
      openended: isSelected
        ? "bg-green-500 text-white hover:bg-green-600"
        : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
      "fill-blanks": isSelected
        ? "bg-yellow-500 text-white hover:bg-yellow-600"
        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
      code: isSelected
        ? "bg-purple-500 text-white hover:bg-purple-600"
        : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
      flashcard: isSelected
        ? "bg-pink-500 text-white hover:bg-pink-600"
        : "bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200",
    }

    return colorMap[type as keyof typeof colorMap] || (isSelected ? "bg-primary text-white" : "bg-muted text-foreground")
  }

  return (
    <div className="space-y-6 lg:w-1/4">
      {/* Desktop Search */}
      <div className="hidden lg:block">
        <SearchBar
          search={search}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          isSearching={isSearching}
        />
      </div>

      {/* Mobile Search and Filter Toggle */}
      <div className="lg:hidden space-y-4">
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
            onClick={toggleMobileFilters}
            className="flex items-center gap-2 border-dashed"
          >
            <Filter className="h-4 w-4" />
            {showMobileFilters ? "Hide Filters" : "Show Filters"}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showMobileFilters ? "rotate-180" : ""}`}
            />
            {selectedTypes.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {selectedTypes.length}
              </span>
            )}
          </Button>

          {selectedTypes.length > 0 && (
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
      </div>

      {/* Filter Section - Desktop always visible, Mobile conditionally visible */}
      <AnimatePresence initial={false}>
        {(showMobileFilters || isDesktop) && (
          <motion.div
            className="space-y-4 bg-card p-4 rounded-lg border shadow-sm lg:shadow-none lg:p-0"
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, overflow: "visible" }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filter by Type
              </h3>
              {selectedTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSearch}
                  className="hidden lg:flex text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {quizTypes.map((type) => {
                const isSelected = selectedTypes.includes(type.id)
                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleQuizType(type.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${getTypeColorClasses(
                      type.id,
                      isSelected,
                    )}`}
                  >
                    <type.icon className={`h-4 w-4 ${isSelected ? "text-white" : `text-${type.color}-600`}`} />
                    {type.label}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
