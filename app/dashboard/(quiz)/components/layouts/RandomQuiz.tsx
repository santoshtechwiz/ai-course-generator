"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Clock,
  RotateCcw,
  ChevronRight,
  StickyNote,
  Sparkles,
  Star,
  Users,
  Target,
  Brain,
  Code2,
  BookOpen,
  PenTool,
  ChevronLeft,
  Filter,
  X,
  TrendingUp,
  Award,
  Play,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion, type PanInfo } from "framer-motion"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import { apiClient } from "@/lib/api-client"
import type React from "react"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"
import { QuizInfoBox } from "./QuizInfoBox"


// Enhanced color schemes with improved gradients and theme alignment
const quizTypeColors = {
  blanks: {
    badge: "bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/30",
    icon: "text-blue-600 dark:text-blue-400",
    pattern: "text-blue-500/60",
    glow: "shadow-blue-500/25",
    hover: "hover:shadow-blue-500/40",
    bg: "from-blue-50/90 via-blue-50/60 to-cyan-50/90 dark:from-blue-950/40 dark:via-blue-950/20 dark:to-cyan-950/40",
    accent: "bg-blue-500/10 dark:bg-blue-400/10",
  },
  flashcard: {
    badge:
      "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white border-0 shadow-lg shadow-orange-500/30",
    icon: "text-orange-600 dark:text-orange-400",
    pattern: "text-orange-500/60",
    glow: "shadow-orange-500/25",
    hover: "hover:shadow-orange-500/40",
    bg: "from-orange-50/90 via-orange-50/60 to-amber-50/90 dark:from-orange-950/40 dark:via-orange-950/20 dark:to-amber-950/40",
    accent: "bg-orange-500/10 dark:bg-orange-400/10",
  },
  openended: {
    badge:
      "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/30",
    icon: "text-purple-600 dark:text-purple-400",
    pattern: "text-purple-500/60",
    glow: "shadow-purple-500/25",
    hover: "hover:shadow-purple-500/40",
    bg: "from-purple-50/90 via-purple-50/60 to-pink-50/90 dark:from-purple-950/40 dark:via-purple-950/20 dark:to-pink-950/40",
    accent: "bg-purple-500/10 dark:bg-purple-400/10",
  },
  code: {
    badge:
      "bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30",
    icon: "text-green-600 dark:text-green-400",
    pattern: "text-green-500/60",
    glow: "shadow-green-500/25",
    hover: "hover:shadow-green-500/40",
    bg: "from-green-50/90 via-green-50/60 to-emerald-50/90 dark:from-green-950/40 dark:via-green-950/20 dark:to-emerald-950/40",
    accent: "bg-green-500/10 dark:bg-green-400/10",
  },
  mcq: {
    badge:
      "bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 text-white border-0 shadow-lg shadow-indigo-500/30",
    icon: "text-indigo-600 dark:text-indigo-400",
    pattern: "text-indigo-500/60",
    glow: "shadow-indigo-500/25",
    hover: "hover:shadow-indigo-500/40",
    bg: "from-indigo-50/90 via-indigo-50/60 to-blue-50/90 dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-blue-950/40",
    accent: "bg-indigo-500/10 dark:bg-indigo-400/10",
  },
}

// Enhanced difficulty colors with better contrast
const difficultyColors = {
  Easy: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-md shadow-emerald-500/25",
  Medium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md shadow-amber-500/25",
  Hard: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-md shadow-rose-500/25",
}

const quizTypeRoutes = {
  blanks: "dashboard/blanks",
  mcq: "dashboard/mcq",
  flashcard: "dashboard/flashcard",
  openended: "dashboard/openended",
  code: "dashboard/code",
}

const quizTypeIcons = {
  blanks: PenTool,
  flashcard: StickyNote,
  openended: BookOpen,
  code: Code2,
  mcq: Brain,
}

const quizTypeLabels = {
  blanks: "Fill Blanks",
  flashcard: "Flashcards",
  openended: "Open Ended",
  code: "Code Quiz",
  mcq: "Multiple Choice",
}

// Enhanced Quiz Card Component with improved animations and visual hierarchy
const QuizCard: React.FC<{
  quiz: any
  index: number
  isVisible: boolean
  isPrefetching?: boolean
  variant?: "default" | "compact" | "featured"
  onSwipe?: (direction: "left" | "right") => void
}> = ({ quiz, index, isVisible, isPrefetching = false, variant = "default", onSwipe }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const Icon = quizTypeIcons[quiz.quizType as keyof typeof quizTypeIcons] || Brain
  const colorScheme = quizTypeColors[quiz.quizType as keyof typeof quizTypeColors] || quizTypeColors.mcq
  const difficultyColor = quiz.difficulty
    ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
    : difficultyColors.Medium

  const isCompact = variant === "compact"
  const isFeatured = variant === "featured"

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Prefetch the quiz data when hovering
  const handlePrefetch = useCallback(() => {
    if (isPrefetching) {
      const quizType = quiz.quizType as string
      const slug = quiz.slug as string
      apiClient
        .get(`/api/quizzes/${quizType}/${slug}`, {
          cache: "force-cache",
          skipAuthCheck: true,
        })
        .then(() => {
          console.log(`Prefetched quiz: ${quiz.title}`)
        })
        .catch((err) => {
          console.debug("Prefetch failed:", err)
        })
    }
  }, [quiz, isPrefetching])

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50
    if (Math.abs(info.offset.x) > threshold && onSwipe) {
      onSwipe(info.offset.x > 0 ? "right" : "left")
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -30,
      transition: { duration: 0.4 },
    },
  };

  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: prefersReducedMotion
      ? { scale: 1.1 }
      : {
          scale: 1.2,
          rotate: 12,
          transition: {
            duration: 0.5,
            ease: "backOut",
          },
        },
    tap: { scale: 0.9 },
  }

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    hover: prefersReducedMotion
      ? { opacity: 0.5 }
      : {
          opacity: 1,
          scale: 1.1,
          transition: {
            duration: 0.6,
            ease: "easeOut",
          },
        },
  }

  return (
    <motion.div
      key={`${quiz.id}-card`}
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      exit="exit"
      className="relative group transition-all duration-700"
      style={{
        minHeight: isCompact ? "280px" : isFeatured ? "440px" : "340px",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: isVisible ? "auto" : "none",
        zIndex: isVisible ? 10 - index : 0,
      }}
      onMouseEnter={() => {
        setIsHovered(true)
        handlePrefetch()
      }}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              y: -8,
              transition: { duration: 0.4, ease: "easeOut" },
            }
      }
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      dragElastic={0.2}
    >
      {/* Enhanced multi-layer glow effect - respect reduced motion */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className={`absolute -inset-2 bg-gradient-to-r ${colorScheme.badge} rounded-3xl opacity-0 blur-2xl`}
            variants={glowVariants}
            initial="initial"
            animate={isHovered ? "hover" : "initial"}
          />
          <motion.div
            className={`absolute -inset-1 bg-gradient-to-r ${colorScheme.badge} rounded-2xl opacity-0 blur-xl`}
            variants={glowVariants}
            initial="initial"
            animate={isHovered ? "hover" : "initial"}
            transition={{ delay: 0.1 }}
          />
        </>
      )}

      <Card className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl hover:shadow-2xl transition-all duration-700 overflow-hidden h-full group flex flex-col">
        {/* Enhanced background with better gradients */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />

        {/* Improved floating orbs with physics-based animations - respect reduced motion */}
        {!prefersReducedMotion && (
          <>
            <motion.div
              className={`absolute top-4 right-4 w-16 h-16 ${colorScheme.accent} rounded-full blur-xl`}
              animate={{
                scale: isHovered ? [1, 1.2, 1.1] : [1, 1.05, 1],
                opacity: isHovered ? [0.3, 0.5, 0.4] : [0.2, 0.3, 0.25],
              }}
              transition={{
                duration: isHovered ? 2 : 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
            <motion.div
              className={`absolute bottom-4 left-4 w-12 h-12 ${colorScheme.accent} rounded-full blur-lg`}
              animate={{
                scale: isHovered ? [1, 1.15, 1.05] : [1, 1.03, 1],
                opacity: isHovered ? [0.2, 0.4, 0.3] : [0.15, 0.25, 0.2],
              }}
              transition={{
                duration: isHovered ? 2.5 : 5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </>
        )}

        {/* Premium badge with enhanced styling */}
        {isPrefetching && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
            className="absolute top-4 right-4 z-10"
          >
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </motion.div>
        )}

        <CardHeader className={cn("space-y-4 relative z-10", isCompact ? "p-4 pb-3" : "p-6 pb-4")}>
          <div className="flex justify-between items-start">
            <motion.div
              variants={iconVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                "rounded-2xl bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-800/70 backdrop-blur-sm",
                "ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-lg group-hover:shadow-xl transition-all duration-500",
                isCompact ? "p-2.5" : "p-3",
              )}
            >
              <Icon className={cn(colorScheme.icon, isCompact ? "h-5 w-5" : "h-6 w-6")} />
            </motion.div>
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700/60"
              >
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {(quiz.rating || 4.2).toFixed(1)}
                </span>
              </motion.div>
              {isFeatured && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "backOut" }}
                  className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-sm"
                >
                  <Award className="h-3 w-3" />
                  <span className="text-xs font-semibold">Featured</span>
                </motion.div>
              )}
            </div>
          </div>
          <CardTitle
            className={cn(
              "font-bold bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 dark:from-slate-100 dark:via-slate-200/90 dark:to-slate-100 bg-clip-text text-transparent",
              "group-hover:from-slate-900 group-hover:to-slate-900 dark:group-hover:from-slate-100 dark:group-hover:to-slate-100 transition-all duration-500 line-clamp-2 leading-tight",
              isCompact ? "text-lg" : "text-xl",
            )}
          >
            {quiz.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${colorScheme.badge} text-xs font-semibold`}>
              {quizTypeLabels[quiz.quizType as keyof typeof quizTypeLabels] || quiz.quizType}
            </Badge>
            <Badge className={`${difficultyColor} text-xs font-semibold`}>{quiz.difficulty || "Medium"}</Badge>
            {quiz.isNew && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold">
                New
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn("relative z-10 flex-1", isCompact ? "px-4 pb-3" : "px-6 pb-4")}>
          {quiz.description && (
            <p
              className={cn(
                "text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 group-hover:text-slate-600/80 dark:group-hover:text-slate-400/80 transition-colors duration-500 leading-relaxed",
                isCompact ? "text-sm" : "text-sm",
              )}
            >
              {quiz.description}
            </p>
          )}
          <div className={cn("grid gap-3 text-sm", isCompact ? "grid-cols-2" : "grid-cols-2")}>
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-600/80 dark:group-hover:text-slate-400/80 transition-colors duration-500">
              <Clock className={cn(colorScheme.icon, "h-4 w-4")} />
              <span className="font-medium">{quiz.duration || "5"} min</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-600/80 dark:group-hover:text-slate-400/80 transition-colors duration-500">
              <Users className={cn(colorScheme.icon, "h-4 w-4")} />
              <span className="font-medium">{quiz.completions || 85}%</span>
            </div>
            {!isCompact && (
              <>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-600/80 dark:group-hover:text-slate-400/80 transition-colors duration-500">
                  <Target className={cn(colorScheme.icon, "h-4 w-4")} />
                  <span className="font-medium">{quiz.popularity || "High"}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 group-hover:text-slate-600/80 dark:group-hover:text-slate-400/80 transition-colors duration-500">
                  <TrendingUp className={cn(colorScheme.icon, "h-4 w-4")} />
                  <span className="font-medium">Trending</span>
                </div>
              </>
            )}
          </div>
          {quiz.completionRate !== undefined && !isCompact && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-600/80 dark:group-hover:text-slate-400/80 transition-colors duration-500">
                  Success Rate
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quiz.completionRate}%</span>
              </div>
              <div className="relative h-2 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                <motion.div
                  className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorScheme.badge}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${quiz.completionRate}%` }}
                  transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className={cn("relative z-10", isCompact ? "p-4 pt-2" : "p-6 pt-2")}>
          <Link
            href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes]}/${quiz.slug}`}
            className="w-full"
            prefetch={true}
          >
            <Button
              className={cn(
                "w-full group/btn relative overflow-hidden transition-all duration-500 font-semibold border-0",
                "bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 dark:from-slate-100 dark:via-slate-200/90 dark:to-slate-100",
                "hover:from-slate-900 hover:via-slate-900 hover:to-slate-900 dark:hover:from-slate-100 dark:hover:via-slate-100 dark:hover:to-slate-100",
                "text-white dark:text-slate-900 shadow-lg hover:shadow-xl hover:shadow-slate-900/25 dark:hover:shadow-slate-100/25",
                "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 dark:after:via-slate-900/20 after:to-transparent",
                "after:translate-x-[-100%] after:group-hover/btn:translate-x-[100%] after:transition-transform after:duration-500",
                isCompact ? "text-sm py-2.5" : "text-sm py-3",
              )}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>Start Quiz</span>
                <motion.div
                  animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
              </span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Enhanced RandomQuiz component with more customization options
interface RandomQuizProps {
  maxQuizzes?: number
  variant?: "default" | "compact" | "featured"
  showFilters?: boolean
  autoRotate?: boolean
  rotateInterval?: number
  className?: string
  title?: string
  subtitle?: string
  initialQuizzes?: any[]
}

export const RandomQuiz: React.FC<RandomQuizProps> = ({
  maxQuizzes = 8,
  variant = "default",
  showFilters = variant !== "featured",
  autoRotate = variant !== "featured",
  rotateInterval = 5000,
  className,
  title = "Discover Quizzes",
  subtitle = "Explore interactive learning",
  initialQuizzes,
}) => {
  const { quizzes, isLoading, error, refresh } = useRandomQuizzes(maxQuizzes)
  const dataToUse = initialQuizzes || quizzes
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate)
  const [loadingMinTime, setLoadingMinTime] = useState(false)

  const processedQuizzes = useMemo(() => {
    if (!dataToUse?.length) return []
    return dataToUse.map((quiz, index) => ({
      ...quiz,
      id: quiz.id || `processed-${index}`,
      slug: quiz.slug || quiz.id || `processed-${index}`,
      title: quiz.title || "Untitled Quiz",
      quizType: quiz.quizType || "mcq",
      duration: quiz.duration || 5 + (index % 5),
      description: quiz.description || `Test your knowledge with this interactive ${quiz.quizType || "mcq"} quiz.`,
      popularity: quiz.popularity || (index % 2 === 0 ? "High" : "Medium"),
      completionRate: quiz.completionRate ?? 50 + ((index * 5) % 50),
      isNew: index < 2,
    }))
  }, [dataToUse])

  const displayQuizzes = useMemo(() => {
    if (!processedQuizzes?.length) return []
    let filtered = [...processedQuizzes]
    if (selectedType) {
      filtered = filtered.filter((quiz) => quiz.quizType === selectedType)
    }
    return filtered
  }, [processedQuizzes, selectedType])

  // Enhanced loading state with minimum display time
  useEffect(() => {
    if (isLoading) {
      setLoadingMinTime(true)
      const timer = setTimeout(() => {
        setLoadingMinTime(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  const nextCard = useCallback(() => {
    if (isTransitioning || displayQuizzes.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % displayQuizzes.length)
      setIsTransitioning(false)
    }, 200)
  }, [displayQuizzes.length, isTransitioning])

  const prevCard = useCallback(() => {
    if (isTransitioning || displayQuizzes.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev === 0 ? displayQuizzes.length - 1 : prev - 1))
      setIsTransitioning(false)
    }, 200)
  }, [displayQuizzes.length, isTransitioning])

  const handleRefresh = useCallback(() => {
    setIsTransitioning(true)
    refresh()
    setTimeout(() => {
      setActiveCardIndex(0)
      setIsTransitioning(false)
    }, 300)
  }, [refresh])

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        nextCard()
      } else {
        prevCard()
      }
    },
    [nextCard, prevCard],
  )

  const quizTypes = useMemo(
    () => [
      {
        key: "openended",
        label: "Open Ended",
        icon: BookOpen,
        shortLabel: "Open",
        count: processedQuizzes.filter((q) => q.quizType === "openended").length,
      },
      {
        key: "blanks",
        label: "Fill Blanks",
        icon: PenTool,
        shortLabel: "Blanks",
        count: processedQuizzes.filter((q) => q.quizType === "blanks").length,
      },
      {
        key: "flashcard",
        label: "Flashcards",
        icon: StickyNote,
        shortLabel: "Flash",
        count: processedQuizzes.filter((q) => q.quizType === "flashcard").length,
      },
      {
        key: "code",
        label: "Code Quiz",
        icon: Code2,
        shortLabel: "Code",
        count: processedQuizzes.filter((q) => q.quizType === "code").length,
      },
      {
        key: "mcq",
        label: "Multiple Choice",
        icon: Brain,
        shortLabel: "MCQ",
        count: processedQuizzes.filter((q) => q.quizType === "mcq").length,
      },
    ],
    [processedQuizzes],
  )

  // Auto-rotate functionality with manual control
  useEffect(() => {
    if (isAutoRotating && !isHovered && displayQuizzes.length > 1 && !isTransitioning) {
      const interval = setInterval(() => {
        nextCard()
      }, rotateInterval)
      return () => clearInterval(interval)
    }
  }, [isAutoRotating, isHovered, displayQuizzes.length, isTransitioning, nextCard, rotateInterval])

  useEffect(() => {
    setActiveCardIndex(0)
  }, [selectedType])

  const shouldShowLoading = isLoading || loadingMinTime

  return (
    <QuizInfoBox
      title={title}
      subtitle={subtitle}
      icon={Sparkles}
      badge={{
        text: "Smart",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      }}
      isLoading={shouldShowLoading}
      onRefresh={handleRefresh}
      className={cn("h-full flex flex-col", className)}
      showRefreshButton={true}
    >
      <motion.div
        className="flex-1 min-h-0 flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Enhanced Filter Section - Desktop */}
        {showFilters && (
          <div className="hidden md:block mb-4">
            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer transition-all duration-300 px-3 py-1.5 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60",
                  "hover:shadow-sm hover:scale-105",
                  !selectedType
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
                onClick={() => setSelectedType(null)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                All ({processedQuizzes.length})
              </Badge>
              {quizTypes.map((type) => {
                const colorScheme = quizTypeColors[type.key as keyof typeof quizTypeColors] || quizTypeColors.mcq
                const Icon = type.icon
                return (
                  <Badge
                    key={type.key}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all duration-300 px-3 py-1.5 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60",
                      "hover:shadow-sm hover:scale-105",
                      selectedType === type.key ? colorScheme.badge : "hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                    onClick={() => setSelectedType(type.key)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {type.shortLabel} ({type.count})
                  </Badge>
                )
              })}
            </motion.div>
          </div>
        )}

        {/* Enhanced Filter Section - Mobile Dialog */}
        <div className="md:hidden mb-4">
          <Dialog open={showFilterPanel} onOpenChange={setShowFilterPanel}>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/60 dark:border-slate-700/60">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-slate-100">Filter Quizzes</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all duration-300 px-3 py-2 text-sm font-medium border border-slate-200/60 dark:border-slate-700/60 justify-center",
                    "hover:shadow-sm hover:scale-105",
                    !selectedType
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                  onClick={() => {
                    setSelectedType(null)
                    setShowFilterPanel(false)
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  All ({processedQuizzes.length})
                </Badge>
                {quizTypes.map((type) => {
                  const colorScheme = quizTypeColors[type.key as keyof typeof quizTypeColors] || quizTypeColors.mcq
                  const Icon = type.icon
                  return (
                    <Badge
                      key={type.key}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all duration-300 px-3 py-2 text-sm font-medium border border-slate-200/60 dark:border-slate-700/60 justify-center",
                        "hover:shadow-sm hover:scale-105",
                        selectedType === type.key ? colorScheme.badge : "hover:bg-slate-100 dark:hover:bg-slate-800",
                      )}
                      onClick={() => {
                        setSelectedType(type.key)
                        setShowFilterPanel(false)
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {type.shortLabel} ({type.count})
                    </Badge>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="w-full flex items-center justify-center space-x-2 text-sm px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {showFilterPanel ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            <span>Filter Quizzes</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
          {shouldShowLoading ? (
            <motion.div
              className="flex items-center justify-center h-64"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center">
                <div className="relative mb-4">
                  <LoadingSpinner />
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Discovering amazing quizzes...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              className="text-center p-6 rounded-xl border border-red-200/60 dark:border-red-800/60 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-red-600 dark:text-red-400 mb-2 text-sm font-semibold">Failed to load quizzes</div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs">
                {error.message.includes("network") || error.message.includes("fetch")
                  ? "Please check your internet connection and try again."
                  : "Something went wrong. Please try again."}
              </p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="text-xs px-3 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            </motion.div>
          ) : displayQuizzes.length > 0 ? (
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div
                className={cn(
                  "relative w-full perspective-1000",
                  variant === "compact" ? "h-72" : variant === "featured" ? "h-[440px]" : "h-80",
                )}
              >
                {/* Render all cards with enhanced 3D effect and partial visibility */}
                <div className="absolute inset-0 w-full h-full">
                  {displayQuizzes.slice(0, 6).map((quiz, index) => {
                    const isActive = index === activeCardIndex
                    const isNext = index === (activeCardIndex + 1) % displayQuizzes.length
                    const isPrev = index === (activeCardIndex - 1 + displayQuizzes.length) % displayQuizzes.length

                    return (
                      <motion.div
                        key={`${quiz.id}-card`}
                        layoutId={`quiz-card-${quiz.id}`}
                        initial={false}
                        animate={
                          isActive
                            ? { opacity: 1, scale: 1, x: "0%", rotateY: 0, zIndex: 3 }
                            : isNext
                              ? { opacity: 0.6, scale: 0.85, x: "15%", rotateY: -5, zIndex: 2 }
                              : isPrev
                                ? { opacity: 0.6, scale: 0.85, x: "-15%", rotateY: 5, zIndex: 2 }
                                : { opacity: 0, scale: 0.8, x: "0%", rotateY: 0, zIndex: 1 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 280,
                          damping: 30,
                          mass: 0.8,
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: isActive ? "auto" : "none",
                          transformOrigin: "center center",
                        }}
                        onAnimationComplete={() => setIsTransitioning(false)}
                      >
                        <QuizCard
                          quiz={quiz}
                          index={index}
                          isVisible={isActive}
                          isPrefetching={isActive || isNext || isPrev}
                          variant={variant}
                          onSwipe={handleSwipe}
                        />
                      </motion.div>
                    )
                  })}
                </div>

                {/* Enhanced Navigation with auto-rotate indicator */}
                {displayQuizzes.length > 1 && (
                  <div
                    className={cn(
                      "absolute left-0 right-0 flex justify-center items-center gap-4",
                      variant === "featured" ? "-bottom-16" : "-bottom-14",
                    )}
                  >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60 dark:border-slate-700/60"
                        onClick={prevCard}
                        disabled={isTransitioning}
                        aria-label="Previous quiz"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </motion.div>

                    <div className="flex items-center gap-2">
                      {displayQuizzes.slice(0, 6).map((_, idx) => (
                        <motion.button
                          key={idx}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300 cursor-pointer relative",
                            idx === activeCardIndex
                              ? "w-8 bg-slate-900 dark:bg-slate-100 shadow-lg shadow-slate-900/50 dark:shadow-slate-100/50"
                              : "w-2 bg-slate-400/60 dark:bg-slate-600/60 hover:bg-slate-400/80 dark:hover:bg-slate-600/80",
                          )}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (!isTransitioning) {
                              setIsTransitioning(true)
                              setActiveCardIndex(idx)
                            }
                          }}
                          aria-label={`Go to quiz ${idx + 1}`}
                        >
                          {/* Auto-rotate progress indicator */}
                          {idx === activeCardIndex && isAutoRotating && (
                            <motion.div
                              className="absolute inset-0 bg-blue-500/60 rounded-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: rotateInterval / 1000, ease: "linear" }}
                              style={{ transformOrigin: "left" }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>

                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60 dark:border-slate-700/60"
                        onClick={nextCard}
                        disabled={isTransitioning}
                        aria-label="Next quiz"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="text-center p-6 rounded-xl border border-dashed border-slate-300/60 dark:border-slate-600/60 bg-slate-50/80 dark:bg-slate-800/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Sparkles className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                  <motion.div
                    className="absolute inset-0 h-12 w-12 text-blue-400/20 dark:text-blue-600/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Sparkles className="h-12 w-12" />
                  </motion.div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">No quizzes found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-xs">
                {selectedType
                  ? `No ${quizTypeLabels[selectedType as keyof typeof quizTypeLabels]} quizzes available right now.`
                  : "No quizzes are currently available."}
              </p>
              <div className="flex flex-col gap-2 justify-center">
                {selectedType && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedType(null)}
                    className="text-xs px-3 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60"
                  >
                    View All Quizzes
                  </Button>
                )}
                <Button
                  onClick={handleRefresh}
                  className="text-xs px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </QuizInfoBox>
  )
}
