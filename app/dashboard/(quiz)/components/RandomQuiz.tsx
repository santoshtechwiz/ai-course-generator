"use client"

import type React from "react"
import { useState } from "react"
import {
  Clock,
  HelpCircle,
  RotateCcw,
  Filter,
  Trophy,
  ChevronRight,
  FileText,
  ClipboardList,
  FileCode,
  StickyNote,
} from "lucide-react"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useRandomQuizzes } from "../hooks/useRandomQuizzes"

// SVG Background Pattern Component
const QuizBackgroundPattern: React.FC<{ quizType: string }> = ({ quizType }) => {
  const patterns = {
    "fill-blanks": (
      <path
        d="M10 10L50 50M30 10L70 50M50 10L90 50M70 10L110 50M90 10L130 50M10 30L50 70M30 30L70 70M50 30L90 70M70 30L110 70M90 30L130 70"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    ),
    flashcard: (
      <g>
        <rect x="10" y="10" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
        <rect x="40" y="10" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
        <rect x="70" y="10" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
        <rect x="10" y="40" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
        <rect x="40" y="40" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
        <rect x="70" y="40" width="20" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
      </g>
    ),
    openended: (
      <g>
        <path d="M10,25 Q50,5 90,25 T170,25" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M10,45 Q50,25 90,45 T170,45" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M10,65 Q50,45 90,65 T170,65" stroke="currentColor" strokeWidth="1" fill="none" />
      </g>
    ),
    code: (
      <g>
        <path d="M20,20 L40,20 L40,25 L20,25 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M45,20 L100,20 L100,25 L45,25 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M20,30 L30,30 L30,35 L20,35 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M35,30 L90,30 L90,35 L35,35 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M20,40 L50,40 L50,45 L20,45 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M55,40 L110,40 L110,45 L55,45 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M20,50 L40,50 L40,55 L20,55 Z" fill="currentColor" fillOpacity="0.2" />
      </g>
    ),
  }

  const defaultPattern = (
    <g>
      <circle cx="20" cy="20" r="5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="50" cy="20" r="5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="80" cy="20" r="5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="20" cy="50" r="5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="50" cy="50" r="5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="80" cy="50" r="5" fill="currentColor" fillOpacity="0.1" />
    </g>
  )

  const patternElement = patterns[quizType as keyof typeof patterns] || defaultPattern

  const getColorClass = () => {
    switch (quizType) {
      case "fill-blanks":
        return "text-blue-500"
      case "flashcard":
        return "text-orange-500"
      case "openended":
        return "text-purple-500"
      case "code":
        return "text-green-500"
      default:
        return "text-primary"
    }
  }

  return (
    <svg
      className={`absolute right-0 bottom-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-300 ${getColorClass()}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMinYMin slice"
    >
      {patternElement}
    </svg>
  )
}

const difficultyColors = {
  Easy: "bg-emerald-50 text-emerald-600",
  Medium: "bg-orange-50 text-orange-600",
  Hard: "bg-rose-50 text-rose-600",
}

const quizTypeRoutes = {
  "fill-blanks": "dashboard/blanks",
  mcq: "dashboard/mcq",
  flashcard: "dashboard/flashcard",
  openended: "dashboard/openended",
  code: "dashboard/code",
}

const quizTypeIcons = {
  "fill-blanks": FileText,
  flashcard: StickyNote,
  openended: ClipboardList,
  code: FileCode,
  mcq: HelpCircle,
}

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error, refresh } = useRandomQuizzes(3)
  const [filter, setFilter] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const quizTypes = ["openended", "fill-blanks", "flashcard", "code"]

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
    refresh()
  }

  const filteredQuizzes = filter ? quizzes.filter((quiz) => quiz.quizType?.toLowerCase() === filter) : quizzes

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="sticky top-0 z-10 p-4 bg-background/95 backdrop-blur border-b">
        <div className="flex justify-between items-center gap-3 mb-3">
          <div className="flex items-center space-x-2" />
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter(null)}
              className={!filter ? "bg-primary/10 border-primary/30" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              <span>{filter ? filter.replace("-", " ") : "All"}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8 rounded-full" title="Refresh quizzes">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quizTypes.map((type) => (
            <Badge
              key={type}
              variant="outline"
              className={`cursor-pointer hover:bg-primary/10 capitalize ${
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
                <Skeleton className="h-8 w-full rounded mt-4" />
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border p-4 text-center">
            <div className="text-destructive mb-2">Failed to load quizzes</div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz, index) => {
            const Icon = quizTypeIcons[quiz.quizType as keyof typeof quizTypeIcons] || HelpCircle
            const bgColor = quiz.difficulty
              ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
              : difficultyColors.Medium
            const color = "text-muted-foreground"

            return (
              <motion.div
                key={`${quiz.id}-${refreshKey}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="relative group mb-4"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300 group-hover:duration-200 animate-tilt"></div>

                <Card className="relative bg-card border border-border group-hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <QuizBackgroundPattern quizType={quiz.quizType || ""} />

                  <CardHeader className="space-y-2 p-4 pb-2 relative z-10">
                    <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                      <span className="group-hover:text-primary/90 transition-colors duration-300 line-clamp-1 mr-2">
                        {quiz.title}
                      </span>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm", bgColor)}
                      >
                        <Icon className={cn("h-4 w-4", color)} />
                      </motion.div>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={cn(bgColor)}>
                        {quiz.difficulty || "Medium"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{quiz.quizType}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10 p-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                        <Clock className="h-4 w-4 mr-2 group-hover:text-primary/70" />
                        <span>{quiz.duration} minutes</span>
                      </div>
                      {quiz.bestScore !== null && (
                        <div className="flex items-center text-muted-foreground group-hover:text-foreground/80">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                          <span>Best: {quiz.bestScore}%</span>
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
                          "w-full group relative overflow-hidden transition-all duration-300 bg-primary hover:bg-primary/90",
                          "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
                          "after:translate-x-[-100%] after:group-hover:translate-x-[100%] after:transition-transform after:duration-500",
                          "shadow-md hover:shadow-lg"
                        )}
                        size="sm"
                      >
                        <span className="relative z-10 mr-1">Start Quiz</span>
                        <motion.span
                          className="relative z-10 ml-1"
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          animate={{ x: [0, 2, 0] }}
                          transition={{
                            x: {
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: "reverse",
                            },
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.span>
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg bg-muted/30">
            <div className="flex justify-center mb-4">
              <HelpCircle className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">No quizzes found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
