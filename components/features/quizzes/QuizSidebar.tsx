"use client"

import { Button } from "@/components/ui/button"
import { FileQuestion, AlignJustify, PenTool, Code, Flashlight, Filter } from "lucide-react"
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

  return (
    <div className="lg:w-1/4 space-y-6">
      {/* Desktop and Mobile Search */}
      <SearchBar
        search={search}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        isSearching={isSearching}
      />

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 w-full"
        >
          <Filter className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
          {selectedTypes.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {selectedTypes.length}
            </span>
          )}
        </Button>
      </div>

      {selectedTypes.length > 0 && (
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {selectedTypes.length} {selectedTypes.length === 1 ? "type" : "types"} selected
        </div>
      )}

      {/* Filter Section - Desktop always visible, Mobile conditionally visible */}
      <div className={`space-y-2 ${!showMobileFilters ? "hidden lg:block" : "block"}`}>
        {quizTypes.map((type) => (
          <Button
            key={type.id}
            variant={selectedTypes.includes(type.id) ? "default" : "outline"}
            size="sm"
            className={`w-full justify-start transition-all duration-200`}
            onClick={() => toggleQuizType(type.id)}
          >
            <type.icon className={`mr-2 h-4 w-4`} />
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

