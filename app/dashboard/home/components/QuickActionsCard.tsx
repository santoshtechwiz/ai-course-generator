"use client"

/**
 * Quick Actions Card
 * 
 * Provides prominent action buttons for key user tasks:
 * - Continue Learning (resume last course/quiz)
 * - View Streaks (navigate to streak tracking)
 * - Review Mistakes (practice incorrect answers)
 * - Start New Quiz (browse quiz library)
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Flame, 
  RefreshCw, 
  BookOpen,
  ArrowRight,
  Trophy,
  Brain
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  link: string
  variant?: "default" | "primary" | "warning" | "success"
  badge?: string
}

interface QuickActionsCardProps {
  continueLearningUrl?: string
  continueLearningTitle?: string
  hasIncorrectAnswers?: boolean
  className?: string
}

export default function QuickActionsCard({
  continueLearningUrl,
  continueLearningTitle,
  hasIncorrectAnswers = false,
  className
}: QuickActionsCardProps) {
  
  // Simplified to 3 most important actions only
  const actions: QuickAction[] = [
    {
      id: "continue",
      title: "Continue Learning",
      description: continueLearningTitle || "Resume where you left off",
      icon: <Play className="h-5 w-5" />,
      link: continueLearningUrl || "/dashboard/courses",
      variant: "primary",
      badge: continueLearningTitle ? "In Progress" : undefined
    },
    {
      id: "streak",
      title: "View Streaks",
      description: "Track your learning consistency",
      icon: <Flame className="h-5 w-5" />,
      link: "/dashboard/flashcard/review",
      variant: "warning"
    },
    {
      id: "quiz",
      title: "Start New Quiz",
      description: "Test your knowledge",
      icon: <Brain className="h-5 w-5" />,
      link: "/dashboard/quizzes",
      variant: "success"
    }
  ]

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-600"
      case "warning":
        return "bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-600"
      case "success":
        return "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-600"
      default:
        return "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-800 border-gray-300 dark:border-gray-700"
    }
  }

  return (
    <Card className={cn("border-border/50 shadow-lg", className)}>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>

        {/* Single row layout - 3 cards on desktop, stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link key={action.id} href={action.link}>
              <Card 
                className={cn(
                  "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer border-2",
                  getVariantStyles(action.variant)
                )}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-lg",
                        action.variant === "default" 
                          ? "bg-white/20 dark:bg-black/20" 
                          : "bg-white/20"
                      )}>
                        {action.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">{action.title}</h4>
                        {action.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/30 dark:bg-black/30 mt-1 inline-block">
                            {action.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-60" />
                  </div>
                  <p className={cn(
                    "text-sm",
                    action.variant === "default" 
                      ? "text-muted-foreground" 
                      : "text-white/90"
                  )}>
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
