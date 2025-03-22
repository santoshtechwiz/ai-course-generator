"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileQuestion, AlignJustify, PenTool, Code, Flashlight, Filter, X } from "lucide-react"
import { SearchBar } from "./SearchBar"
import type { QuizType } from "@/app/types/types"
import type React from "react"
import { useState } from "react"

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

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters)
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
          <Button variant="outline" size="sm" onClick={toggleMobileFilters} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {showMobileFilters ? "Hide Filters" : "Show Filters"}
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
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter Section - Desktop always visible, Mobile conditionally visible */}
      <motion.div
        className={`space-y-4 ${!showMobileFilters ? "hidden lg:block" : "block"}`}
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: showMobileFilters ? "auto" : 0,
          opacity: showMobileFilters ? 1 : 0,
          display: showMobileFilters ? "block" : "none",
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Filter by Type</h3>
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
          {quizTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedTypes.includes(type.id) ? "default" : "outline"}
              size="sm"
              className={`justify-start transition-all duration-200 ${
                selectedTypes.includes(type.id)
                  ? `bg-primary hover:bg-primary/90 text-primary-foreground`
                  : `hover:bg-muted`
              }`}
              onClick={() => toggleQuizType(type.id)}
            >
              <type.icon
                className={`mr-2 h-4 w-4 ${selectedTypes.includes(type.id) ? "text-primary-foreground" : "text-primary"}`}
              />
              {type.label}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

