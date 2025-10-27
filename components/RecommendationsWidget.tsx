"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import neo from "@/components/neo/tokens"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Brain, RefreshCw, TrendingUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSmartRecommendations } from "@/hooks/useRecommendations"
import { EnhancedErrorBoundary } from "@/components/error-boundary"
import { AppLoader } from "@/components/ui/loader"

interface Recommendation {
  type: "course" | "quiz"
  id: string
  title: string
  slug: string
  description?: string
  category?: string
  quizType?: string
  reason: string
  confidence: number
  aiReasoning?: string
}

function RecommendationsWidget() {
  const {
    recommendations,
    count,
    isLoading,
    error,
    invalidateCache,
    isInvalidating
  } = useSmartRecommendations()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended for You</CardTitle>
        </CardHeader>
        <CardContent>
          <AppLoader
            size="medium"
            message="Generating personalized recommendations..."
            className="py-8"
          />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Unable to load recommendations</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Recommended for You</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => invalidateCache()}
          disabled={isInvalidating}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isInvalidating ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations available yet</p>
            <p className="text-sm">Complete some courses or quizzes to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec: Recommendation) => (
              <RecommendationItem key={rec.id} recommendation={rec} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const { type, title, slug, description, category, quizType, reason, confidence, aiReasoning } = recommendation

  const buildQuizSlug = (quizType: string) => {
    switch (quizType) {
      case "mcq":
        return "mcq"
      case "openended":
        return "openended"
      case "blanks":
        return "blanks"
      case "code":
        return "code"
      case "flashcard":
        return "flashcard"
      default:
        return "quiz"
    }
  }

  const linkHref = type === "course"
    ? `/dashboard/course/${slug}`
    : `/dashboard/${buildQuizSlug(category || quizType || "quiz")}/${slug}`

  const confidenceColor = confidence >= 0.8 ? "bg-success/10 text-success dark:bg-success/5 dark:text-success" :
                         confidence >= 0.6 ? "bg-warning/10 text-warning dark:bg-warning/5 dark:text-warning" :
                         "bg-muted text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground"

  return (
    <div className="flex items-start gap-3 p-4 rounded-sm border-2 border-border hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border)] transition-none bg-card shadow-[4px_4px_0px_0px_var(--border)]">
      <div className="flex-shrink-0 mt-1">
        {type === "course" ? (
          <BookOpen className="h-5 w-5 text-primary" />
        ) : (
          <Brain className="h-5 w-5 text-secondary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <Link href={linkHref} className="hover:underline">
              <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h4>
            </Link>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="neutral" className={cn(neo.badge, `text-xs ${confidenceColor} border-0`)}>
              {Math.round(confidence * 100)}% match
            </Badge>
            <Badge variant="neutral" className={cn(neo.badge, "text-xs")}>
              {type === "course" ? "Course" : "Quiz"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {category && (
            <Badge variant="neutral" className={cn(neo.badge, "text-xs bg-primary/5")}>
              {category}
            </Badge>
          )}
          {quizType && (
            <Badge variant="neutral" className={cn(neo.badge, "text-xs bg-secondary/5")}>
              {quizType}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Why recommended:</span> {reason}
          </p>
          {aiReasoning && aiReasoning !== reason && (
            <p className="text-xs text-primary/70 italic">
              🤖 {aiReasoning}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-none border">
              <Skeleton className="h-5 w-5 mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Wrapped component with error boundary for better error handling
function RecommendationsWidgetWithErrorBoundary() {
  return (
    <EnhancedErrorBoundary
      fallback={(error, reset) => (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load recommendations</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      )}
    >
      <RecommendationsWidget />
    </EnhancedErrorBoundary>
  )
}

export default RecommendationsWidgetWithErrorBoundary
