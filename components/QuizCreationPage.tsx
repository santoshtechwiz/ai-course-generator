'use client'
import type React from "react"
import Link from "next/link"
import { QuizWrapper } from "@/components/QuizWrapper"
import RandomQuote from "@/components/RandomQuote"
import RandomQuiz from "@/components/RandomQuiz"
import { BookOpen, Lightbulb, AlertCircle, CheckCircle, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Common component for quiz creation pages
export default function QuizCreationPage({
  type,
  title,
  metadata,
  schemas,
}: {
  type: "mcq" | "openended" | "fill-in-the-blanks" | "code" | "flashcard"
  title: string
  metadata: {
    creativeWorkSchema: any
    breadcrumbSchema: any
  }
  schemas?: React.ReactNode
}) {
  const quizTypeLabels = {
    mcq: "Multiple Choice Quiz",
    "fill-in-the-blanks": "Fill in the Blanks Quiz",
    openended: "Open-Ended Questions",
    code: "Code Challenge",
    flashcard: "Flashcard Set",
  }

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 sm:px-6 space-y-8">
      {schemas}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.creativeWorkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.breadcrumbSchema) }}
      />
      <div className="max-w-4xl mx-auto">
        <RandomQuote />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <Card className="relative bg-background/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden h-full">
            <CardHeader className="pb-4 border-b border-border/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
                  <BookOpen className="mr-2 h-6 w-6 text-primary" />
                  Create a New {title}
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                        <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                        Pro tip: Be specific with your topic
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Specific topics lead to better quiz questions and more accurate results.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription className="mt-2">
                Create a custom {quizTypeLabels[type]} to test knowledge or prepare for exams.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <QuizWrapper type={type} />
            </CardContent>
          </Card>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <Card className="relative bg-background/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-border/10">
            <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-medium">Discover Quizzes</CardTitle>
              <CardDescription>Explore popular quizzes created by others</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RandomQuiz />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



// Error component for quiz pages
export function QuizError({
  message,
  returnPath,
}: {
  message: string
  returnPath: string
}) {
  return (
    <Card className="w-full max-w-3xl mx-auto my-8 border shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-destructive">
          <AlertCircle className="mr-2 h-5 w-5" />
          Error
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Button asChild>
          <Link href={returnPath}>Return to Quizzes</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Success component for quiz completion
export function QuizSuccess({
  score,
  message,
  actions,
}: {
  score?: number
  message: string
  actions?: React.ReactNode
}) {
  return (
    <Card className="w-full max-w-3xl mx-auto my-8 border shadow-md overflow-hidden">
      <div className="bg-green-50 dark:bg-green-900/20 py-3 px-6 border-b border-green-100 dark:border-green-900/30">
        <CardTitle className="flex items-center text-green-700 dark:text-green-400">
          <CheckCircle className="mr-2 h-5 w-5" />
          Quiz Completed
        </CardTitle>
      </div>
      <CardContent className="pt-6">
        {score !== undefined && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-50 dark:bg-green-900/20 mb-2">
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">{score}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Your Score</p>
          </div>
        )}
        <p className="text-center text-muted-foreground">{message}</p>
      </CardContent>
      {actions && <CardFooter className="flex justify-center gap-4 pt-2 pb-6">{actions}</CardFooter>}
    </Card>
  )
}

// Loading skeleton
export function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

