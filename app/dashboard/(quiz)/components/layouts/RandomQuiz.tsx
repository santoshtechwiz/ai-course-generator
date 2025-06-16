"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import {
  Clock,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  FileText,
  ClipboardList,
  FileCode,
  StickyNote,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import { apiClient } from "@/lib/api-client"
import type React from "react"

// SVG Background Pattern Component
const QuizBackgroundPattern: React.FC<{ quizType: string }> = ({ quizType }) => {
  // Extract the patterns to an object with proper typing
  const patterns: Record<string, React.ReactNode> = {
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
  Easy: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  Medium: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
  Hard: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
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

// Enhance the RandomQuiz component with better animations and visual feedback

// Improve the quiz card with better animations and visual hierarchy
const QuizCard: React.FC<{
  quiz: any
  index: number
  isVisible: boolean
  isPrefetching?: boolean
}> = ({ quiz, index, isVisible, isPrefetching = false }) => {
  const Icon = quizTypeIcons[quiz.quizType as keyof typeof quizTypeIcons] || HelpCircle
  const bgColor = quiz.difficulty
    ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
    : difficultyColors.Medium

  // Prefetch the quiz data when hovering
  const handlePrefetch = useCallback(() => {
    if (isPrefetching) {
      const quizType = quiz.quizType as string
      const slug = quiz.slug as string
      const baseUrl = `/${quizTypeRoutes[quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${slug}`

      // Use apiClient for prefetching
      apiClient
        .get(`/api/quizzes/${quizType}/${slug}`, {
          cache: "force-cache",
          skipAuthCheck: true,
        })
        .then(() => {
          // Successfully prefetched
          console.log(`Prefetched quiz: ${quiz.title}`)
        })
        .catch((err) => {
          // Silently fail on prefetch errors
          console.debug("Prefetch failed:", err)
        })
    }
  }, [quiz, isPrefetching])

  return (
    <motion.div
      key={quiz.id}
      initial={isVisible ? { opacity: 0, scale: 0.95, y: 30 } : false}
      animate={
        isVisible
          ? {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 180,
                damping: 24,
                mass: 0.8,
              },
            }
          : {
              opacity: 0,
              scale: 0.95,
              y: 30,
              transition: { duration: 0.2 },
            }
      }
      exit={{ opacity: 0, scale: 0.95, y: 30, transition: { duration: 0.2 } }}
      className="relative group mb-4 transition-all duration-300"
      style={{
        minHeight: 320,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: isVisible ? "auto" : "none",
        zIndex: isVisible ? 10 - index : 0,
      }}
      onMouseEnter={handlePrefetch}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300 group-hover:duration-200 animate-tilt"></div>
      <Card className="relative bg-card border border-border group-hover:border-primary/20 transition-all duration-300 overflow-hidden h-full shadow-md group-hover:shadow-lg group-hover:shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <QuizBackgroundPattern quizType={quiz.quizType || ""} />
        <CardHeader className="space-y-2 p-4 pb-2 relative z-10">
          <CardTitle className="flex justify-between items-center text-base sm:text-lg">
            <span className="group-hover:text-primary/90 transition-colors duration-300 line-clamp-1 mr-2 font-semibold">
              {quiz.title}
            </span>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm",
                bgColor,
              )}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={cn(bgColor, "transition-all duration-300 group-hover:scale-105")}>
              {quiz.difficulty || "Medium"}
            </Badge>
            <span className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
              {quiz.quizType}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 p-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
              <Clock className="h-4 w-4 mr-2 group-hover:text-primary/70" />
              <span>{quiz.duration || "5"} min</span>
            </div>
            {quiz.bestScore !== null && (
              <div className="flex items-center text-muted-foreground group-hover:text-foreground/80">
                <TrendingUp className="h-4 w-4 mr-2 text-primary/70" />
                <span>Popularity: {quiz.popularity || "High"}</span>
              </div>
            )}
          </div>
          {quiz.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/90 transition-colors duration-300">
              {quiz.description}
            </p>
          )}
          {quiz.completionRate !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                  Completion
                </span>
                <span className="text-xs font-medium group-hover:text-primary transition-colors duration-300">
                  {quiz.completionRate}%
                </span>
              </div>
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full"
                  initial={{ width: `${quiz.completionRate}%` }}
                  whileHover={{ width: `${quiz.completionRate}%`, opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="relative z-10 p-4 pt-2 mt-auto">
          <Link
            href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}
            className="w-full"
            prefetch={true}
          >
            <Button
              className={cn(
                "w-full group relative overflow-hidden transition-all duration-300 bg-primary hover:bg-primary/90",
                "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
                "after:translate-x-[-100%] after:group-hover:translate-x-[100%] after:transition-transform after:duration-500",
                "shadow-md hover:shadow-lg hover:shadow-primary/20 font-medium",
              )}
              size="sm"
            >
              <span className="relative z-10 mr-1">Start Quiz</span>
              <motion.span
                className="relative z-10 ml-1"
                initial={{ x: 0 }}
                whileHover={{ scale: 1.1, rotate: 15 }}
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
}

export const RandomQuiz: React.FC = () => {
  // Fetch random quizzes
  const { quizzes, isLoading, error, refresh } = useRandomQuizzes(5) // Reduced to 5 for better performance
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // useRef to store the previous card index
  const prevCardIndex = useRef(0)

  // Debug quizzes data when it changes
  useEffect(() => {
    console.log("Current quizzes data:", quizzes)
  }, [quizzes])

  // Process quizzes to add any missing data with DETERMINISTIC values (not random)
  const processedQuizzes = useMemo(() => {
    if (!quizzes?.length) return []

    return quizzes.map((quiz, index) => ({
      ...quiz,
      // Ensure all required fields have values
      id: quiz.id || `processed-${index}`,
      slug: quiz.slug || quiz.id || `processed-${index}`,
      title: quiz.title || "Untitled Quiz",
      quizType: quiz.quizType || "mcq",
      // Use deterministic values instead of random
      duration: quiz.duration || 5 + (index % 5),
      description: quiz.description || `Test your knowledge with this interactive ${quiz.quizType || "mcq"} quiz.`,
      popularity: quiz.popularity || (index % 2 === 0 ? "High" : "Medium"),
      completionRate: quiz.completionRate ?? 50 + ((index * 5) % 50),
    }))
  }, [quizzes])

  // Get filtered quizzes
  const displayQuizzes = useMemo(() => {
    if (!processedQuizzes?.length) return []

    let filtered = [...processedQuizzes]

    // Apply type filter if selected
    if (selectedType) {
      filtered = filtered.filter((quiz) => quiz.quizType === selectedType)
    }

    console.log("Display quizzes after filtering:", filtered)
    return filtered
  }, [processedQuizzes, selectedType])

  // Show next card with smooth transition
  const nextCard = useCallback(() => {
    if (isTransitioning || displayQuizzes.length <= 1) return

    setIsTransitioning(true)
    prevCardIndex.current = activeCardIndex // Store the previous index
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % displayQuizzes.length)
      setIsTransitioning(false)
    }, 200)
  }, [displayQuizzes.length, isTransitioning, activeCardIndex])

  // Show previous card with smooth transition
  const prevCard = useCallback(() => {
    if (isTransitioning || displayQuizzes.length <= 1) return

    setIsTransitioning(true)
    prevCardIndex.current = activeCardIndex // Store the previous index
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev === 0 ? displayQuizzes.length - 1 : prev - 1))
      setIsTransitioning(false)
    }, 200)
  }, [displayQuizzes.length, isTransitioning, activeCardIndex])

  // Manual refresh with loading indicator
  const handleRefresh = useCallback(() => {
    setIsTransitioning(true)
    refresh()
    setTimeout(() => {
      setActiveCardIndex(0)
      setIsTransitioning(false)
    }, 300)
  }, [refresh])

  // Memoize the list of quiz types
  const quizTypes = useMemo(() => ["openended", "fill-blanks", "flashcard", "code", "mcq"], [])

  // Reset card index when filters change
  useEffect(() => {
    setActiveCardIndex(0)
  }, [selectedType])

  // Animation variants for button groups
  const buttonGroupVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Filter UI */}
      <div className="sticky top-0 z-20 p-4 bg-background/95 backdrop-blur-lg border-b">
        <div className="flex justify-between items-center gap-3 mb-3">
          <h2 className="text-lg font-medium">Random Quizzes</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8 rounded-full"
            disabled={isLoading || isTransitioning}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          </Button>
        </div>

        <motion.div className="flex flex-wrap gap-2" variants={buttonGroupVariants} initial="hidden" animate="visible">
          <motion.div variants={buttonVariants}>
            <Badge
              variant="outline"
              className={`cursor-pointer hover:bg-primary/10 ${!selectedType ? "bg-primary/20 border-primary/50" : ""}`}
              onClick={() => setSelectedType(null)}
            >
              All Types
            </Badge>
          </motion.div>
          {quizTypes.map((type) => (
            <motion.div key={type} variants={buttonVariants}>
              <Badge
                variant="outline"
                className={`cursor-pointer hover:bg-primary/10 capitalize ${
                  selectedType === type ? "bg-primary/20 border-primary/50" : ""
                }`}
                onClick={() => setSelectedType(type)}
              >
                {type.replace("-", " ")}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col min-h-[450px]">
        <div className="flex-1 p-4 relative">
          {isLoading ? (
            <div className="relative w-full max-w-md mx-auto h-[320px] flex items-center justify-center">
              <Card className="w-full h-full flex flex-col items-center justify-center bg-background/50 border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-sm">Finding quizzes for you...</p>
              </Card>
            </div>
          ) : error ? (
            <div className="rounded-lg border p-8 text-center max-w-md mx-auto">
              <div className="text-destructive mb-4">Failed to load quizzes</div>
              <pre className="text-xs text-muted-foreground overflow-auto max-h-20 mb-4">{error.message}</pre>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : displayQuizzes.length > 0 ? (
            <div className="relative w-full max-w-md mx-auto h-[320px] perspective-1000 overflow-visible">
              {/* Simpler rendering for debugging */}
              {displayQuizzes.slice(0, 5).map((quiz, index) => (
                <QuizCard
                  key={`${quiz.id}-${index}`}
                  quiz={quiz}
                  index={index}
                  isVisible={index === activeCardIndex}
                  isPrefetching={index === activeCardIndex}
                />
              ))}

              {/* Debug information */}
              <div className="absolute top-[-30px] left-0 right-0 text-xs text-muted-foreground">
                Showing quiz {activeCardIndex + 1} of {displayQuizzes.length}
              </div>

              {/* Card navigation controls */}
              {displayQuizzes.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={prevCard}
                    disabled={isTransitioning}
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {displayQuizzes.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeCardIndex ? "w-4 bg-primary" : "w-1.5 bg-primary/30"
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={nextCard}
                    disabled={isTransitioning}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg bg-muted/30 max-w-md mx-auto">
              <div className="flex justify-center mb-4">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-2">No quizzes found for this filter.</p>
              {selectedType && (
                <p className="text-xs text-muted-foreground mb-4">
                  Current filter: {selectedType} (Found {processedQuizzes.length} total quizzes before filtering)
                </p>
              )}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedType(null)
                  handleRefresh()
                }}
              >
                View All Quizzes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
