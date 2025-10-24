"use client"

import Link from "next/link"
import { useRelatedQuizzes } from "@/hooks/useRelatedQuizzes"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { neo } from "@/components/neo/tokens"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Target } from "lucide-react"

interface RelatedQuizSuggestionsProps {
  quizType?: string
  excludeSlug?: string
  difficulty?: string
  tags?: string[]
  limit?: number
  title?: string
}

export function RelatedQuizSuggestions({
  quizType,
  excludeSlug,
  difficulty,
  tags,
  limit = 6,
  title = "You may also like",
}: RelatedQuizSuggestionsProps) {
  const { quizzes, loading } = useRelatedQuizzes({ quizType, exclude: excludeSlug, difficulty, tags, limit })

  if (loading) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-3 space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!quizzes || quizzes.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quizzes.slice(0, 3).map((q) => (
          <Link key={q.id} href={`/dashboard/${q.quizType}/${q.slug}`} className="group rounded-lg border bg-card p-3 hover:border-primary/50 transition-colors">
            <div className="text-sm font-medium line-clamp-1 group-hover:text-primary">{q.title}</div>
              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
              <Badge variant="neutral" className={cn(neo.badge, "text-[10px]")}>{q.quizType}</Badge>
              <span>{q.questionCount} qns</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}