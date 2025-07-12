"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FullCourseType } from "@/app/types/types"
import MainContent from "./MainContent"
import { cn } from "@/lib/utils"
import CourseActions from "./CourseActions"

interface EnhancedCourseLayoutProps {
  course: FullCourseType
  initialChapterId?: string
  breadcrumbs?: {
    label: string
    href: string
  }[]
}

const EnhancedCourseLayout: React.FC<EnhancedCourseLayoutProps> = ({
  course,
  initialChapterId,
  breadcrumbs = []
}) => {
  const [theatreMode, setTheatreMode] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <header
        className={cn(
          "bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between",
          "transition-all duration-300",
          theatreMode && "h-0 p-0 overflow-hidden opacity-0"
        )}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheatreMode(!theatreMode)}
        >
          {theatreMode ? "Exit Theater Mode" : "Theater Mode"}
        </Button>
      </header>

      {/* Main area */}
      <div className={cn("flex-1", theatreMode && "bg-black")}>
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
              <MainContent course={course} initialChapterId={initialChapterId} />
        </div>
      </div>
    </div>
  )
}

export default EnhancedCourseLayout
