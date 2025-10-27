"use client"

import { usePathname } from "next/navigation"
import { LandingLayout } from "./LandingLayout"
import { CourseLayout } from "./CourseLayout"
import { QuizLayout } from "./QuizLayout"
import { DashboardLayout } from "./DashboardLayout"

interface DynamicLayoutManagerProps {
  children: React.ReactNode
}

/**
 * Dynamic Layout Manager
 *
 * Conditionally renders different layout components based on the current route:
 * - Landing pages: Minimal header for marketing
 * - Course pages: Course-specific sticky header
 * - Quiz pages: Quiz-focused navigation
 * - Dashboard: Full dashboard navbar
 */
export function DynamicLayoutManager({ children }: DynamicLayoutManagerProps) {
  const pathname = usePathname()

  // Determine layout type based on pathname
  const getLayoutType = (path: string) => {
    if (path === "/" || path.startsWith("/contact") || path.startsWith("/privacy") || path.startsWith("/terms")) {
      return "landing"
    }
    if (path.startsWith("/dashboard/course/")) {
      return "course"
    }
    if (path.includes("/quiz") || path.startsWith("/ordering-quiz-demo")) {
      return "quiz"
    }
    if (path.startsWith("/dashboard")) {
      return "dashboard"
    }
    return "landing" // Default fallback
  }

  const layoutType = getLayoutType(pathname)

  switch (layoutType) {
    case "landing":
      return <LandingLayout>{children}</LandingLayout>
    case "course":
      return <CourseLayout>{children}</CourseLayout>
    case "quiz":
      return <QuizLayout>{children}</QuizLayout>
    case "dashboard":
      return <DashboardLayout>{children}</DashboardLayout>
    default:
      return <LandingLayout>{children}</LandingLayout>
  }
}