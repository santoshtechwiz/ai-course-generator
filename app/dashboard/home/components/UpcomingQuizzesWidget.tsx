"use client"

/**
 * Upcoming Quizzes Widget - Redesigned
 * 
 * Features:
 * - Proper quiz routing using slug and type
 * - Theme-aware colors using CSS variables
 * - Cleaner, lighter design
 * - Optimized shadcn components
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Clock, 
  Play,
  CheckCircle2,
  Brain,
  Code,
  FileText,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Quiz {
  id: number
  slug: string
  title: string
  type: "mcq" | "blanks" | "openended" | "code" | "flashcard"
  difficulty: "EASY" | "MEDIUM" | "HARD"
  totalQuestions: number
  estimatedMinutes: number
  progress?: number
  lastAttemptScore?: number
  status: "not-started" | "in-progress" | "completed"
}

interface UpcomingQuizzesWidgetProps {
  quizzes?: Quiz[]
  className?: string
}

const difficultyConfig = {
  EASY: {
    variant: "default" as const,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
  },
  MEDIUM: {
    variant: "secondary" as const,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800"
  },
  HARD: {
    variant: "destructive" as const,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200 dark:border-rose-800"
  }
}

const typeConfig = {
  mcq: { icon: CheckCircle2, label: "MCQ", path: "mcq" },
  blanks: { icon: FileText, label: "Fill Blanks", path: "blanks" },
  openended: { icon: Brain, label: "Open-Ended", path: "openended" },
  code: { icon: Code, label: "Code", path: "code" },
  flashcard: { icon: BookOpen, label: "Flashcards", path: "flashcard" }
}

export default function UpcomingQuizzesWidget({
  quizzes = [],
  className
}: UpcomingQuizzesWidgetProps) {
  
  if (quizzes.length === 0) {
    return (
      <Card className={cn("border-border/40", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-4 w-4 text-primary" />
            Upcoming Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No quizzes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a quiz to test your knowledge
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/quizzes">
                Browse Quizzes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-border/40", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-4 w-4 text-primary" />
            Upcoming Quizzes
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {quizzes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {quizzes.map((quiz, index) => {
          const TypeIcon = typeConfig[quiz.type]?.icon || Brain
          
          // Route to quiz page with quiz type and slug
          const quizPath = typeConfig[quiz.type]?.path || "mcq"
          const quizUrl = `/dashboard/${quizPath}/${quiz.slug}`
          
          return (
            <div key={quiz.id}>
              {index > 0 && <Separator className="my-3" />}
              
              <div className="group space-y-3">
                {/* Quiz Header */}
                <div className="flex items-start gap-3">
                  <div className="rounded-none bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                    <TypeIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={quizUrl} className="hover:underline">
                      <h4 className="font-medium text-sm leading-tight line-clamp-2">
                        {quiz.title}
                      </h4>
                    </Link>
                    
                    {/* Meta Info */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs h-5", difficultyConfig[quiz.difficulty].className)}
                      >
                        {quiz.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.estimatedMinutes}m
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {quiz.totalQuestions} questions
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress (if in progress) */}
                {quiz.status === "in-progress" && quiz.progress !== undefined && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{Math.round(quiz.progress)}%</span>
                    </div>
                    <Progress value={quiz.progress} className="h-1.5" />
                  </div>
                )}

                {/* Last Score (if completed) */}
                {quiz.status === "completed" && quiz.lastAttemptScore !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Last score: {quiz.lastAttemptScore}%</span>
                  </div>
                )}

                {/* Action Button */}
                <Button asChild size="sm" className="w-full" variant={
                  quiz.status === "completed" ? "outline" : "default"
                }>
                  <Link href={quizUrl}>
                    <Play className="mr-2 h-3.5 w-3.5" />
                    {quiz.status === "not-started" && "Start Quiz"}
                    {quiz.status === "in-progress" && `Continue (${Math.round(quiz.progress || 0)}%)`}
                    {quiz.status === "completed" && "Retake Quiz"}
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}

        {/* View All */}
        <Separator className="my-3" />
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/dashboard/quiz">
            View All Quizzes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
