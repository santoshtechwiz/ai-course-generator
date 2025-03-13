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
  Filter,
  Brain,
} from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
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
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderColor: "border-emerald-200 dark:border-emerald-500/30",
    icon: CheckCircle2,
  },
  Medium: {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    borderColor: "border-amber-200 dark:border-amber-500/30",
    icon: HelpCircle,
  },
  Hard: {
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    borderColor: "border-rose-200 dark:border-rose-500/30",
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

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filter, setFilter] = useState<string | null>(null)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Add random properties to quizzes for demonstration
  const enhancedQuizzes = React.useMemo(() => {
    return quizzes.map((quiz) => ({
      ...quiz,
      bestScore: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : null,
      completionRate: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 10) + 5,
    }))
  }, [quizzes])

  const quizTypes = Array.from(new Set(enhancedQuizzes.map((quiz) => quiz.quizType)))

  const filteredQuizzes = filter ? enhancedQuizzes.filter((quiz) => quiz.quizType === filter) : enhancedQuizzes

  return (
    <div className="h-full space-y-4 bg-background">
      <div className="sticky top-0 z-10 pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Discover Quizzes</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter(null)}
              className={!filter ? "bg-primary/10 border-primary/30" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filter ? filter.replace("-", " ") : "All"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8 rounded-full"
              title="Refresh quizzes"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quizTypes.map((type) => (
            <Badge
              key={type}
              variant="outline"
              className={`cursor-pointer hover:bg-primary/10 transition-colors capitalize ${
                filter === type ? "bg-primary/20 border-primary/50" : ""
              }`}
              onClick={() => setFilter(type)}
            >
              {type.replace("-", " ")}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-6 border border-dashed rounded-lg">
          <p className="text-destructive mb-3">Unable to load quizzes</p>
          <Button variant="outline" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          {filteredQuizzes.map((quiz, index) => {
            const difficulty = getQuizDifficulty(quiz.quizType)
            const { color, bgColor, borderColor } = difficultyConfig[difficulty as keyof typeof difficultyConfig]
            const Icon = iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle

            // Determine if quiz is new or popular (for demonstration)
            const isNew = quiz?.id?.toString().endsWith("1") ?? false
            const isPopular = quiz?.id?.toString().endsWith("2") ?? false

            return (
              <motion.div
                key={`${quiz.id}-${refreshKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="relative group"
              >
                {/* Hover glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300 group-hover:duration-200 animate-tilt"></div>

                <Card className="relative bg-card border border-border group-hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <CardHeader className="space-y-1 relative z-10">
                    <CardTitle className="flex justify-between items-center text-xl">
                      <span className="group-hover:text-primary/90 transition-colors duration-300 line-clamp-1">
                        {quiz.title}
                      </span>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300",
                          bgColor,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", color)} />
                      </motion.div>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className={cn(bgColor, color, borderColor)}>
                        {difficulty}
                      </Badge>
                      <span className="capitalize">{quiz.quizType.replace("-", " ")}</span>
                      {isNew && (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                        >
                          New
                        </Badge>
                      )}
                      {isPopular && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                        <Clock className="h-4 w-4 mr-2 group-hover:text-primary/70 transition-colors duration-300" />
                        {quiz.duration} minutes
                      </div>
                      {quiz.bestScore !== null && (
                        <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                          Best: {quiz.bestScore}%
                        </div>
                      )}
                    </div>

                    {quiz.completionRate !== undefined && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs font-medium">{quiz.completionRate}%</span>
                        </div>
                        <Progress value={quiz.completionRate} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="relative z-10">
                    <Link
                      href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}
                      className="w-full"
                    >
                      <Button
                        className={cn(
                          "w-full group relative overflow-hidden transition-all duration-300",
                          "bg-primary hover:bg-primary/90",
                          "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
                          "after:translate-x-[-100%] after:group-hover:translate-x-[100%] after:transition-transform after:duration-500",
                        )}
                        size="sm"
                      >
                        Start Quiz
                        <motion.div
                          className="ml-2"
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}

      {filteredQuizzes.length === 0 && !isLoading && !error && (
        <div className="text-center p-6 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-3">No quizzes found</p>
          <Button variant="outline" onClick={() => setFilter(null)}>
            Show All Quizzes
          </Button>
        </div>
      )}

      <div className="pt-2">
        <Button className="w-full group relative overflow-hidden transition-all duration-300" variant="outline" asChild>
          <Link href="/dashboard/quizzes" className="flex items-center justify-center">
            <span>Explore More Quizzes</span>
            <motion.div
              className="ml-2"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default RandomQuiz

