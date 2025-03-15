import type React from "react"
import Link from "next/link"
import { QuizWrapper } from "@/components/QuizWrapper"
import RandomQuote from "@/components/RandomQuote"
import RandomQuiz from "@/components/RandomQuiz"
import { BookOpen, Lightbulb, Sparkles, AlertCircle, CheckCircle, ArrowLeft, Share2, Brain } from "lucide-react"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import QuizSchema from "@/app/schema/quiz-schema"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Common component for quiz creation pages
export function QuizCreationPage({
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

// Common component for quiz detail slug pages
export function QuizDetailPage({
  title,
  description,
  slug,
  quizType,
  questionCount,
  estimatedTime,
  breadcrumbItems,
  children,
}: {
  title: string
  description: string
  slug: string
  quizType: string
  questionCount: number
  estimatedTime: string
  breadcrumbItems: { name: string; url: string }[]
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-8 md:py-12 px-4 sm:px-6 space-y-8">
      <QuizSchema
        quiz={{
          title: title,
          description: description,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level: "Intermediate",
          slug: slug,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        <div className="lg:w-3/4">
          <Card className="overflow-hidden border shadow-md">
            <CardHeader className="bg-muted/40 border-b space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2">
                  <Link href="/dashboard/quizzes">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Sparkles className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <CardDescription className="text-sm md:text-base">{description}</CardDescription>
              <div className="flex flex-wrap gap-3 pt-1">
                <Badge type={quizType} />
                <Badge icon={<Clock />} text={`${estimatedTime} min`} />
                <Badge icon={<FileText />} text={`${questionCount} questions`} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
            </CardContent>
          </Card>
        </div>
        <div className="lg:w-1/4">
          <Card className="sticky top-20 overflow-hidden border shadow-md">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-lg font-medium">Discover Quizzes</CardTitle>
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

// Custom Badge component for quiz metadata
function Badge({ type, icon, text }: { type?: string; icon?: React.ReactNode; text?: string }) {
  let content = text
  const badgeIcon = icon

  if (type) {
    const typeColors = {
      mcq: "bg-blue-50 text-blue-700 border-blue-200",
      openended: "bg-purple-50 text-purple-700 border-purple-200",
      "fill-in-the-blanks": "bg-amber-50 text-amber-700 border-amber-200",
      code: "bg-emerald-50 text-emerald-700 border-emerald-200",
      flashcard: "bg-rose-50 text-rose-700 border-rose-200",
    }

    content = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ")
    return (
      <span
        className={cn(
          "px-2.5 py-1 text-xs font-medium rounded-full border",
          typeColors[type as keyof typeof typeColors] || "bg-gray-50 text-gray-700 border-gray-200",
        )}
      >
        {content}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">
      {badgeIcon}
      {content}
    </span>
  )
}

// Import icons for badges
import { Clock, FileText } from "lucide-react"

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

