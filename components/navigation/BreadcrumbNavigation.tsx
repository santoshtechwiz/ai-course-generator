"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home, BookOpen, GraduationCap, BrainCircuit } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb Navigation Component
 * 
 * Provides clear navigation path back to dashboard and parent pages
 * Auto-generates breadcrumbs from URL path if items not provided
 */
export function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = React.useMemo(() => {
    if (items) return items

    const paths = pathname.split("/").filter(Boolean)
    const generated: BreadcrumbItem[] = [
      { label: "Dashboard", href: "/dashboard", icon: <Home className="w-3.5 h-3.5" /> }
    ]

    paths.forEach((path, index) => {
      // Skip dashboard as it's already added
      if (path === "dashboard") return

      const href = "/" + paths.slice(0, index + 1).join("/")
      
      // Determine icon and label based on path segment
      let icon: React.ReactNode = null
      let label = path
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      if (path === "learn" || path === "course") {
        icon = <BookOpen className="w-3.5 h-3.5" />
        label = "Courses"
      } else if (path.includes("quiz") || path === "flashcard" || path === "blanks" || path === "openended") {
        icon = <BrainCircuit className="w-3.5 h-3.5" />
        label = path === "flashcard" ? "Flashcards" : 
               path === "blanks" ? "Fill in the Blanks" :
               path === "openended" ? "Open-Ended Quiz" : "Quiz"
      } else if (path === "review") {
        label = "Review"
      } else if (path === "results") {
        label = "Results"
      }

      // Don't add slug paths (they'll be added as course/quiz names)
      if (!path.includes("[") && !path.match(/^[a-f0-9-]{36}$/i)) {
        generated.push({ label, href, icon })
      }
    })

    return generated
  }, [pathname, items])

  if (breadcrumbs.length <= 1) {
    return null // Don't show breadcrumbs if only dashboard
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("mb-4 sm:mb-6", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1
          
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              )}
              
              {isLast ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  {item.icon}
                  <span className="truncate max-w-[200px] sm:max-w-none">
                    {item.label}
                  </span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 hover:text-foreground transition-colors",
                    "hover:underline underline-offset-4"
                  )}
                >
                  {item.icon}
                  <span className="truncate max-w-[150px] sm:max-w-none">
                    {item.label}
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Quick Dashboard Link Component
 * 
 * Floating button to quickly return to dashboard from deep pages
 */
function DashboardQuickLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-primary/10 text-primary hover:bg-primary/20",
        "transition-colors text-sm font-medium",
        className
      )}
    >
      <Home className="w-3.5 h-3.5" />
      <span>Back to Dashboard</span>
    </Link>
  )
}

/**
 * Learning Dashboard Link Component
 * 
 * Specific link to learning/courses section
 */
export function LearningDashboardLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard/learn"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
        "transition-colors text-sm font-medium",
        className
      )}
    >
      <BookOpen className="w-3.5 h-3.5" />
      <span>My Courses</span>
    </Link>
  )
}


