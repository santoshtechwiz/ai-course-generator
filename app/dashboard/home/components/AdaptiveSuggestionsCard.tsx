"use client"

/**
 * Adaptive Suggestions Card
 * 
 * Uses adaptive-learning.service.ts to provide personalized learning tips:
 * - "Focus more on [weak topic]"
 * - "Review [specific content]"
 * - "Practice more [quiz type]"
 * - Difficulty adjustments based on performance
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Lightbulb, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AdaptiveSuggestion {
  id: string
  type: "focus" | "review" | "practice" | "difficulty" | "general"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  topic?: string
  estimatedTime?: number
}

interface AdaptiveSuggestionsCardProps {
  userId: string
  suggestions?: AdaptiveSuggestion[]
  isLoading?: boolean
  className?: string
}

const typeIcons = {
  focus: <AlertCircle className="h-5 w-5" />,
  review: <TrendingUp className="h-5 w-5" />,
  practice: <Lightbulb className="h-5 w-5" />,
  difficulty: <Brain className="h-5 w-5" />,
  general: <CheckCircle2 className="h-5 w-5" />
}

const priorityColors = {
  high: "border-red-500 bg-red-50 dark:bg-red-950/30",
  medium: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
  low: "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
}

const priorityBadgeColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
}

export default function AdaptiveSuggestionsCard({
  userId,
  suggestions = [],
  isLoading = false,
  className
}: AdaptiveSuggestionsCardProps) {
  const [displaySuggestions, setDisplaySuggestions] = useState<AdaptiveSuggestion[]>(suggestions)

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      // Sort by priority (high first)
      const sorted = [...suggestions].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      setDisplaySuggestions(sorted)
    } else {
      // Default suggestions if none provided
      setDisplaySuggestions([
        {
          id: "default-1",
          type: "general",
          priority: "medium",
          title: "Start Your Learning Journey",
          description: "Complete your first quiz to unlock personalized learning suggestions based on your performance.",
          actionLabel: "Browse Quizzes",
          actionLink: "/dashboard/quizzes"
        }
      ])
    }
  }, [suggestions])

  if (isLoading) {
    return (
      <Card className={cn("border-border/50 shadow-lg", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Adaptive Learning Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-none bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-border/50 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Adaptive Learning Suggestions
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          AI-powered recommendations based on your learning patterns
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displaySuggestions.map((suggestion) => (
            <Card 
              key={suggestion.id}
              className={cn(
                "border-l-4 transition-all duration-300 hover:shadow-md",
                priorityColors[suggestion.priority]
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-none bg-white dark:bg-gray-800">
                      {typeIcons[suggestion.type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", priorityBadgeColors[suggestion.priority])}
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                      {suggestion.topic && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          Topic: {suggestion.topic}
                        </Badge>
                      )}
                      {suggestion.estimatedTime && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ~{suggestion.estimatedTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {suggestion.actionLink && (
                  <Link href={suggestion.actionLink}>
                    <Button 
                      size="sm" 
                      className="w-full"
                      variant={suggestion.priority === "high" ? "default" : "outline"}
                    >
                      {suggestion.actionLabel || "Take Action"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}

          {displaySuggestions.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Showing top {Math.min(3, displaySuggestions.length)} suggestions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
