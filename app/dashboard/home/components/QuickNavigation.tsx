"use client"

/**
 * Quick Navigation Component
 * 
 * Provides easy access to all main dashboard sections and quiz types
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BookOpen,
  Brain,
  FileText,
  Code,
  CreditCard,
  Target,
  TrendingUp,
  CheckCircle2,
  FileQuestion,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickNavItem {
  label: string
  href: string
  icon: React.ElementType
  description?: string
  color: string
}

const navigationItems: QuickNavItem[] = [
  {
    label: "All Quizzes",
    href: "/dashboard/quizzes",
    icon: Target,
    description: "Browse all quizzes",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    label: "MCQ Quizzes",
    href: "/dashboard/mcq",
    icon: CheckCircle2,
    description: "Multiple choice",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    label: "Flashcards",
    href: "/dashboard/flashcard",
    icon: CreditCard,
    description: "Study cards",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400"
  },
  {
    label: "Fill Blanks",
    href: "/dashboard/blanks",
    icon: FileText,
    description: "Fill in the blanks",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  },
  {
    label: "Open-Ended",
    href: "/dashboard/openended",
    icon: Brain,
    description: "Essay questions",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    label: "Code Quiz",
    href: "/dashboard/code",
    icon: Code,
    description: "Programming",
    color: "bg-green-500/10 text-green-600 dark:text-green-400"
  },
  {
    label: "Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
    description: "Video courses",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
  },
  {
    label: "Explore",
    href: "/dashboard/explore",
    icon: Sparkles,
    description: "Discover new content",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
  }
]

export default function QuickNavigation() {
  return (
    <Card className="border-border/40">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Quick Navigation</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="group">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-auto flex flex-col items-center gap-2 p-3",
                      "hover:scale-105 transition-all duration-200",
                      "border-border/40 hover:border-primary/20"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      item.color,
                      "group-hover:scale-110"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium leading-tight">
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
