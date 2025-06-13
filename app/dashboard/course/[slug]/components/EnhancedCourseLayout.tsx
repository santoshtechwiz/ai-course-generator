"use client"

import { useState } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Home, ChevronRight, Menu } from "lucide-react"
import { FullCourseType } from "@/app/types/types"
import MainContent from "./MainContent"
import { cn } from "@/lib/utils"

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
      <header className={cn(
        "bg-background/95 backdrop-blur-sm border-b p-3 flex items-center justify-between",
        "transition-all duration-300",
        theatreMode && "h-0 p-0 overflow-hidden opacity-0"
      )}>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/courses">Courses</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
            </BreadcrumbItem>
          ))}
          <BreadcrumbItem>
            <span className="text-muted-foreground line-clamp-1 max-w-32 md:max-w-64">
              {course.title}
            </span>
          </BreadcrumbItem>
        </Breadcrumb>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheatreMode(!theatreMode)}
        >
          {theatreMode ? "Exit Theater Mode" : "Theater Mode"}
        </Button>
      </header>

      {/* Main content with theatre mode support */}
      <div className={cn(
        "flex-1",
        theatreMode && "bg-black"
      )}>
        <MainContent 
          course={course} 
          initialChapterId={initialChapterId} 
        />
      </div>
    </div>
  )
}

export default EnhancedCourseLayout
