"use client"

import type React from "react"
import { useState } from "react"
import { Clock, HelpCircle, RotateCcw, Filter, Brain, Trophy, ChevronRight } from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

const difficultyColors = {
  Easy: "bg-emerald-50 text-emerald-600",
  Medium: "bg-orange-50 text-orange-600",
  Hard: "bg-rose-50 text-rose-600",
}

const quizTypeRoutes = {
  "fill-blanks": "dashboard/fill-blanks",
  flashcard: "dashboard/flashcards",
  openended: "dashboard/open-ended",
}

const quizTypeIcons = {
  "fill-blanks": "Edit, Edit3",
  flashcard: "LayoutList",
  openended: "MessageSquare",
}

const quizTypeBgColors = {
  "fill-blanks": "bg-blue-50 text-blue-600",
  flashcard: "bg-orange-50 text-orange-600",
  openended: "bg-purple-50 text-purple-600",
}

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error, refresh, setLimit } = useRandomQuizzes(3)
  const [filter, setFilter] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const quizTypes = ["openended", "fill-blanks", "flashcard"]

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
    refresh()
  }

  const filteredQuizzes = filter ? quizzes.filter((quiz) => quiz.quizType.toLowerCase() === filter) : quizzes

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="sticky top-0 z-10 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
          <div className="flex items-center space-x-2">
            {/* <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium tracking-tight text-foreground">Discover Quizzes</h2> */}
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

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="rounded-lg border p-1">
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div>Failed to load quizzes.</div>
        ) : (
          <>
            {filteredQuizzes.map((quiz, index) => {
              const Icon = HelpCircle // Replace with actual icon component if available
              const bgColor = difficultyColors.Medium // Replace with actual difficulty color logic
              const color = "text-muted-foreground"

              return (
                <motion.div
                  key={`${quiz.id}-${refreshKey}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="relative group mb-4"
                >
                  {/* Hover glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300 group-hover:duration-200 animate-tilt"></div>

                  <Card className="relative bg-card border border-border group-hover:border-primary/20 transition-all duration-300 overflow-hidden">
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <CardHeader className="space-y-2 p-4 pb-2 relative z-10">
                      <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                        <span className="group-hover:text-primary/90 transition-colors duration-300 line-clamp-1 mr-2">
                          {quiz.title}
                        </span>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 15 }}
                          className={cn(
                            "h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300",
                            bgColor,
                          )}
                        >
                          <Icon className={cn("h-4 w-4", color)} />
                        </motion.div>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={cn(difficultyColors.Medium)}>
                          Medium
                        </Badge>
                        <span className="text-sm text-muted-foreground">{quiz.quizType}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="relative z-10 p-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
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
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-medium">{quiz.completionRate}%</span>
                          </div>
                          <Progress value={quiz.completionRate} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="relative z-10 p-4 pt-2">
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
                          <span>Start Quiz</span>
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
          </>
        )}
        {filteredQuizzes.length === 0 && !isLoading && !error && (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No quizzes found</p>
            <Button variant="outline" onClick={() => setFilter(null)}>
              Show All Quizzes
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 pt-2 border-t">
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

