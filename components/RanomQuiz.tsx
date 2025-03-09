"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  FileQuestion,
  AlignJustify,
  HelpCircle,
  ChevronRight,
  Trophy,
  Sparkles,
  Star,
  Clock,
  RotateCcw,
} from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const iconMap = {
  mcq: CheckCircle2,
  openended: FileQuestion,
  "fill-blanks": AlignJustify,
  code: Sparkles,
}

const quizTypeRoutes = {
  mcq: "dashboard/mcq",
  openended: "dashboard/openended",
  code: "dashboard/code",
  "fill-blanks": "dashboard/blanks",
}

const difficultyConfig = {
  Easy: {
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Medium: {
    color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400",
    icon: HelpCircle,
  },
  Hard: {
    color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400",
    icon: FileQuestion,
  },
}

const getQuizDifficulty = (quizType: string) => {
  switch (quizType) {
    case "mcq":
      return "Easy"
    case "openended":
    case "fill-blanks":
      return "Hard"
    default:
      return "Medium"
  }
}

const RandomQuizCard: React.FC<{ quiz: any; index: number }> = React.memo(({ quiz, index }) => {
  const difficulty = getQuizDifficulty(quiz.quizType)
  const { color } = difficultyConfig[difficulty as keyof typeof difficultyConfig]
  const Icon = iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle

  // Determine if quiz is new or popular (for demonstration)
  const isNew = quiz?.id?.toString().endsWith("1") ?? false
  const isPopular = quiz?.id?.toString().endsWith("2") ?? false

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="group"
    >
      <Link href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}>
        <div className="relative mb-3 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />

          <div className="flex items-start space-x-3 p-3 rounded-md border border-border/50 group-hover:border-primary/30 transition-colors duration-300 bg-card">
            <div className={cn("rounded-md p-2", color, "flex-shrink-0")}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium line-clamp-1 pr-1">{quiz.title}</h3>
                {isNew && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-1 py-0 h-4 ml-1"
                  >
                    New
                  </Badge>
                )}
                {isPopular && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 text-[10px] px-1 py-0 h-4 ml-1"
                  >
                    <Star className="h-2 w-2 mr-0.5" />
                    Hot
                  </Badge>
                )}
              </div>

              <div className="flex items-center mt-1 mb-1.5">
                <Badge variant="outline" className={cn(color, "text-[10px] px-1 py-0 h-4")}>
                  {difficulty}
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-2 capitalize">
                  {quiz.quizType.replace("-", " ")}
                </span>
              </div>

              {quiz.completionRate !== undefined && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      <span>{Math.floor(Math.random() * 10) + 5} min</span>
                    </div>
                    <span className="text-[10px] font-medium">{quiz.completionRate}%</span>
                  </div>
                  <Progress value={quiz.completionRate} className="h-1 bg-muted" />
                </div>
              )}

              {quiz.bestScore && (
                <div className="flex items-center mt-1.5 text-[10px] font-medium">
                  <Trophy className="h-2.5 w-2.5 mr-1 text-yellow-500" />
                  Best: {quiz.bestScore}%
                </div>
              )}
            </div>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/70"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </Link>
    </motion.div>
  )
})

RandomQuizCard.displayName = "RandomQuizCard"

const QuizCardSkeleton: React.FC = () => (
  <div className="flex items-start space-x-3 p-3 rounded-md border border-border/50 mb-3">
    <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
    <div className="flex-grow space-y-2">
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-1 w-full" />
    </div>
  </div>
)

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Add random properties to quizzes for demonstration
  if (quizzes.length > 0) {
    quizzes.forEach((quiz, index) => {
      quiz.bestScore = Math.floor(Math.random() * 100)
      quiz.bestScore = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : null
    })
  }

  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Sparkles className="h-4 w-4 text-primary mr-1.5" />
            Discover Quizzes
          </CardTitle>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-6 w-6 rounded-full"
            title="Refresh quizzes"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-3 py-2 space-y-1">
        <AnimatePresence mode="wait" key={refreshKey}>
          {isLoading ? (
            <>
              {[...Array(3)].map((_, index) => (
                <QuizCardSkeleton key={index} />
              ))}
            </>
          ) : error ? (
            <div className="text-center p-3">
              <p className="text-destructive text-xs mb-2">Unable to load quizzes</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs h-7 px-2">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {quizzes.map((quiz, index) => (
                <RandomQuizCard key={`${quiz.id}-${refreshKey}`} quiz={quiz} index={index} />
              ))}
            </>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="px-3 pb-3 pt-1">
        <Button className="w-full h-8 text-xs" variant="outline" asChild>
          <Link href="/dashboard/quizzes" className="flex items-center justify-center">
            <span>Explore More</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default RandomQuiz

