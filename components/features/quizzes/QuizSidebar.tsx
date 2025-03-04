import { Button } from "@/components/ui/button"

import { FileQuestion, AlignJustify, PenTool, Code, Flashlight } from "lucide-react"
import { SearchBar } from "./SearchBar"
import type { QuizType } from "@/app/types/types"
import type React from "react" // Import React

const quizTypes = [
  { id: "mcq" as const, label: "Multiple Choice", icon: FileQuestion, color: "blue" },
  { id: "openended" as const, label: "Open Ended", icon: AlignJustify, color: "green" },
  { id: "fill-blanks" as const, label: "Fill in the Blanks", icon: PenTool, color: "yellow" },
  { id: "code" as const, label: "Code", icon: Code, color: "purple" },
  { id: "flashcard" as const, label: "Flash Card", icon:Flashlight , color: "pink" },
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
  return (
    <div className="lg:w-1/4 space-y-6">
      <SearchBar
        search={search}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        isSearching={isSearching}
      />

      {selectedTypes.length > 0 && (
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {selectedTypes.length} {selectedTypes.length === 1 ? "type" : "types"} selected
        </div>
      )}

      {/* <ScrollArea className="h-[calc(100vh-12rem)]"> */}
        <div className="space-y-2">
          {quizTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedTypes.includes(type.id) ? "default" : "outline"}
              size="sm"
              className={`w-full justify-start transition-all duration-200 ${
                selectedTypes.includes(type.id)
                  ? `bg-${type.color}-500 hover:bg-${type.color}-600 text-white`
                  : `hover:bg-${type.color}-100`
              }`}
              onClick={() => toggleQuizType(type.id)}
            >
              <type.icon
                className={`mr-2 h-4 w-4 ${selectedTypes.includes(type.id) ? "text-white" : `text-${type.color}-500`}`}
              />
              {type.label}
            </Button>
          ))}
        </div>
      {/* </ScrollArea> */}
    </div>
  )
}

