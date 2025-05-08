"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  FileText,
  Star,
  BookOpen,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Progress } from "@/components/ui/progress"

import { ShareButton } from "@/components/ShareButton"

import { Breadcrumb } from "../../../../components/breadcrumb"
import { RandomQuiz } from "./RandomQuiz"
import RandomQuote from "@/components/RandomQuote"
// Update import to use the correct utility function
import { cn } from "@/lib/utils/utils"
import QuizActions from "./QuizActions"
import type { QuizType } from "@/app/types/quiz-types"

interface QuizDetailsPageProps {
  title: string
  description: string
  slug: string
  quizType: QuizType
  questionCount: number
  estimatedTime: string
  difficulty?: "easy" | "medium" | "hard"
  authorId?: string
  quizId?: string
  isFavorite?: boolean
  isPublic?: boolean
  children: React.ReactNode
  breadcrumbItems?: { name: string; href: string }[]
  category?: string
  tags?: string[]
  completionRate?: number
}

// Create reusable style constants
const DIFFICULTY_STYLES = {
  easy: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  hard: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
}

const QUIZ_TYPE_STYLES = {
  mcq: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  openended:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
  "fill-blanks":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  code: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  flashcard: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
}

export default function QuizDetailsPage({
  title,
  description,
  slug,
  quizType,
  questionCount,
  estimatedTime,
  difficulty = "medium",
  authorId,
  quizId,
  isFavorite = false,
  isPublic = true,
  children,
  breadcrumbItems = [],
  category,
  tags = [],
  completionRate,
}: QuizDetailsPageProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [isBookmarked, setIsBookmarked] = useState(isFavorite)
  const [showConfetti, setShowConfetti] = useState(false)

  // Memoize values that don't need to be recalculated on every render
  const quizTypeLabels = useMemo(
    () => ({
      mcq: "Multiple Choice",
      openended: "Open-Ended",
      "fill-blanks": "Fill in the Blanks",
      code: "Code Challenge",
      flashcard: "Flashcards",
    }),
    [],
  )

  const difficultyConfig = useMemo(
    () => ({
      easy: {
        stars: 1,
        label: "Easy",
        color: "text-emerald-500 dark:text-emerald-400",
      },
      medium: {
        stars: 2,
        label: "Medium",
        color: "text-amber-500 dark:text-amber-400",
      },
      hard: {
        stars: 3,
        label: "Hard",
        color: "text-red-500 dark:text-red-400",
      },
    }),
    [],
  )

  // Memoize the formatted time to prevent recalculations
  const formattedTime = useMemo(() => {
    if (typeof estimatedTime === "string" && estimatedTime.includes("PT")) {
      return `${Number.parseInt(estimatedTime.replace(/PT(\d+)M/, "$1"))} min`
    }
    return estimatedTime
  }, [estimatedTime])

  const toggleBookmark = () => {
    setIsBookmarked((prev) => !prev)
    // Here you would typically call an API to update the bookmark status
    if (!isBookmarked) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }

  // Safely get quiz type style
  const getQuizTypeStyle = (type: QuizType) => {
    return (
      QUIZ_TYPE_STYLES[type as keyof typeof QUIZ_TYPE_STYLES] ||
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700"
    )
  }

  // Safely get difficulty style
  const getDifficultyStyle = (diff: string) => {
    return DIFFICULTY_STYLES[diff as keyof typeof DIFFICULTY_STYLES] || DIFFICULTY_STYLES.medium
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 sm:px-6 space-y-6">
      {/* Confetti effect when bookmarking */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
      {/* Fixed: Added proper spacing for breadcrumbs to clear the navbar */}
      <div className="pt-16 mb-6">
        {/* Breadcrumbs */}
        {breadcrumbItems.length > 0 && (
          <div>
            <Breadcrumb paths={breadcrumbItems} showIcons={true} separator={<ChevronRight className="h-4 w-4" />} />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        <div className="lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b space-y-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2 hover:bg-background/50">
                    <Link href="/dashboard//quizzes">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleBookmark}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        isBookmarked
                          ? "text-primary hover:text-primary/80"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isBookmarked ? "bookmarked" : "unbookmarked"}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                    <ShareButton slug={slug} title={title} type={quizType} />
                    {quizId && userId && (
                      <QuizActions
                        quizId={quizId}
                        quizSlug={slug}
                        initialIsPublic={isPublic}
                        initialIsFavorite={isFavorite}
                        userId={userId}
                        ownerId={authorId || ""}
                        quizType={quizType}
                        position="left-center"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">{title}</CardTitle>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <CardDescription className="text-sm md:text-base mt-2">{description}</CardDescription>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="flex flex-wrap gap-3 pt-1"
                >
                  <Badge
                    variant="outline"
                    className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getQuizTypeStyle(quizType))}
                  >
                    {quizTypeLabels[quizType as keyof typeof quizTypeLabels] || "Quiz"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700"
                  >
                    <Clock className="h-3 w-3" />
                    {formattedTime}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700"
                  >
                    <FileText className="h-3 w-3" />
                    {questionCount} questions
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                            getDifficultyStyle(difficulty).bg,
                            getDifficultyStyle(difficulty).text,
                            getDifficultyStyle(difficulty).border,
                          )}
                        >
                          <div className="flex">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < difficultyConfig[difficulty as keyof typeof difficultyConfig].stars
                                    ? difficultyConfig[difficulty as keyof typeof difficultyConfig].color
                                    : "text-muted-foreground/30",
                                )}
                              />
                            ))}
                          </div>
                          {difficultyConfig[difficulty as keyof typeof difficultyConfig].label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Quiz difficulty level</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {category && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800"
                    >
                      <BookOpen className="h-3 w-3" />
                      {category}
                    </Badge>
                  )}
                </motion.div>

                {completionRate !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="mt-2"
                  >
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-muted-foreground">Completion Progress</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </motion.div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <React.Suspense fallback={<QuizDetailsSkeleton />}>{children}</React.Suspense>
              </CardContent>

              {tags && tags.length > 0 && (
                <CardFooter className="flex flex-wrap gap-2 p-4 border-t">
                  <span className="text-sm text-muted-foreground mr-2">Tags:</span>
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </CardFooter>
              )}
            </Card>
          </motion.div>
        </div>

        <div className="lg:w-1/3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden border shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Discover More
                </CardTitle>
                <CardDescription>Try a random quiz to test your knowledge</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <RandomQuiz />
              </CardContent>
            </Card>

            {/* Add RandomQuote component */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <RandomQuote />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function QuizDetailsSkeleton() {
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
