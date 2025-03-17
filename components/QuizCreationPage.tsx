"use client"
import type React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  return (
    <motion.div
      className="container mx-auto py-8 md:py-12 px-4 sm:px-6 space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {schemas}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.creativeWorkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.breadcrumbSchema) }}
      />

     
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         {/* Enhanced RandomQuote with better animation and styling */}
         <motion.div className="col-span-1 lg:col-span-3" variants={itemVariants}>
    <div className="relative overflow-hidden rounded-xl shadow-lg border border-primary/10">
      <RandomQuote />
    </div>
  </motion.div>

        <motion.div className="lg:col-span-2 relative group" variants={itemVariants}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <Card className="relative bg-background/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden h-full">
            <CardHeader className="pb-4 border-b border-border/10 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-foreground">Create a New {title}</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="hidden sm:flex items-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                      >
                        <Lightbulb className="h-4 w-4 mr-1.5 text-amber-500" />
                        Pro tip: Be specific with your topic
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Specific topics lead to better quiz questions and more accurate results.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription className="mt-2 text-base">
                Create a custom {quizTypeLabels[type]} to test knowledge or prepare for exams.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <QuizWrapper type={type} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="relative group" variants={itemVariants}>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <Card className="relative bg-background/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-border/10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Brain className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg font-medium">Discover Quizzes</CardTitle>
              </div>
              <CardDescription>Explore popular quizzes created by others</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RandomQuiz />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="w-full max-w-3xl mx-auto my-8 border shadow-md">
        <CardHeader className="border-b bg-red-50 dark:bg-red-900/20">
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter className="pt-2 pb-6">
          <Button asChild className="shadow-sm">
            <Link href={returnPath}>Return to Quizzes</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    >
      <Card className="w-full max-w-3xl mx-auto my-8 border shadow-md overflow-hidden">
        <div className="bg-green-50 dark:bg-green-900/20 py-3 px-6 border-b border-green-100 dark:border-green-900/30">
          <CardTitle className="flex items-center text-green-700 dark:text-green-400">
            <CheckCircle className="mr-2 h-5 w-5" />
            Quiz Completed
          </CardTitle>
        </div>
        <CardContent className="pt-6">
          {score !== undefined && (
            <motion.div
              className="text-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-50 dark:bg-green-900/20 mb-2 shadow-inner">
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">{score}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Your Score</p>
            </motion.div>
          )}
          <p className="text-center text-muted-foreground">{message}</p>
        </CardContent>
        {actions && <CardFooter className="flex justify-center gap-4 pt-2 pb-6">{actions}</CardFooter>}
      </Card>
    </motion.div>
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
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

