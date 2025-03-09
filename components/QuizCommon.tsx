import type React from "react"
import Link from "next/link"
import { QuizWrapper } from "@/components/QuizWrapper"
import RandomQuote from "@/components/RandomQuote"
import RandomQuiz from "@/components/RanomQuiz"
import { BookOpen, Lightbulb, Sparkles, AlertCircle, CheckCircle } from "lucide-react"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import QuizSchema from "@/app/schema/quiz-schema"

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
    <div className="container mx-auto py-6 space-y-6">
      {schemas}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.creativeWorkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.breadcrumbSchema) }}
      />
      <RandomQuote />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center text-foreground">
                <BookOpen className="mr-2 h-6 w-6 text-primary" />
                Create a New {title}
              </h2>
              <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                Pro tip: Be specific with your topic
              </div>
            </div>
            <QuizWrapper type={type} />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-border/50">
            <RandomQuiz />
          </div>
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
    <div className="container mx-auto py-6 space-y-6">
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

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4">
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/40 border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
            </CardContent>
          </Card>
        </div>
        <div className="lg:w-1/4">
          <RandomQuiz />
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
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
          Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
      <CardFooter>
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
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          Quiz Completed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {score !== undefined && <div className="text-center text-lg font-medium mb-4">Your score: {score}%</div>}
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
      {actions && <CardFooter className="flex justify-center gap-4">{actions}</CardFooter>}
    </Card>
  )
}

// Loading skeleton
export function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

