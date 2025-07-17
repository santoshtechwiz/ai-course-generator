"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Clock,
  RotateCcw,
  ChevronRight,
  StickyNote,
  Loader2,
  Sparkles,
  Star,
  Users,
  Zap,
  Target,
  Brain,
  Code2,
  BookOpen,
  PenTool,
  ChevronLeft,
  Filter,
  X,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes" // Assuming this hook exists
import { apiClient } from "@/lib/api-client" // Assuming this client exists
import type React from "react"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader" // Assuming this component exists

// Enhanced color schemes for different quiz types
const quizTypeColors = {
  blanks: {
    badge: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/25",
    icon: "text-blue-500",
    pattern: "text-blue-400",
    glow: "shadow-blue-500/20",
    hover: "hover:shadow-blue-500/30",
  },
  flashcard: {
    badge: "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg shadow-orange-500/25",
    icon: "text-orange-500",
    pattern: "text-orange-400",
    glow: "shadow-orange-500/20",
    hover: "hover:shadow-orange-500/30",
  },
  openended: {
    badge: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/25",
    icon: "text-purple-500",
    pattern: "text-purple-400",
    glow: "shadow-purple-500/20",
    hover: "hover:shadow-purple-500/30",
  },
  code: {
    badge: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/25",
    icon: "text-green-500",
    pattern: "text-green-400",
    glow: "shadow-green-500/20",
    hover: "hover:shadow-green-500/30",
  },
  mcq: {
    badge: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0 shadow-lg shadow-indigo-500/25",
    icon: "text-indigo-500",
    pattern: "text-indigo-400",
    glow: "shadow-indigo-500/20",
    hover: "hover:shadow-indigo-500/30",
  },
}

// Enhanced difficulty colors with gradients
const difficultyColors = {
  Easy: "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-0 shadow-md shadow-emerald-500/20",
  Medium: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md shadow-amber-500/20",
  Hard: "bg-gradient-to-r from-rose-400 to-red-500 text-white border-0 shadow-md shadow-rose-500/20",
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

// Enhanced SVG Background Pattern Component
const QuizBackgroundPattern: React.FC<{ quizType: string }> = ({ quizType }) => {
  const colorScheme = quizTypeColors[quizType as keyof typeof quizTypeColors] || quizTypeColors.mcq
  const patterns: Record<string, React.ReactNode> = {
    blanks: (
      <g>
        <defs>
          <linearGradient id="fillBlanksGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="10" y="15" width="30" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
        <rect x="45" y="15" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="70" y="15" width="25" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
        <rect x="10" y="25" width="25" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="40" y="25" width="35" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
        <rect x="10" y="35" width="40" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
        <rect x="55" y="35" width="15" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="75" y="35" width="20" height="3" rx="1.5" fill="url(#fillBlanksGrad)" />
      </g>
    ),
    flashcard: (
      <g>
        <defs>
          <linearGradient id="flashcardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <rect
          x="15"
          y="15"
          width="25"
          height="18"
          rx="3"
          fill="url(#flashcardGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="45"
          y="20"
          width="25"
          height="18"
          rx="3"
          fill="url(#flashcardGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="75"
          y="25"
          width="25"
          height="18"
          rx="3"
          fill="url(#flashcardGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
      </g>
    ),
    openended: (
      <g>
        <defs>
          <linearGradient id="openendedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d="M15,20 Q30,15 45,20 T75,20" stroke="url(#openendedGrad)" strokeWidth="2" fill="none" />
        <path d="M15,30 Q35,25 55,30 T85,30" stroke="url(#openendedGrad)" strokeWidth="2" fill="none" />
        <path d="M15,40 Q25,35 35,40 T65,40" stroke="url(#openendedGrad)" strokeWidth="2" fill="none" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="25" cy="30" r="1.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="30" cy="40" r="1.5" fill="currentColor" fillOpacity="0.2" />
      </g>
    ),
    code: (
      <g>
        <defs>
          <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect x="15" y="18" width="8" height="3" rx="1" fill="url(#codeGrad)" />
        <rect x="26" y="18" width="20" height="3" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="49" y="18" width="12" height="3" rx="1" fill="url(#codeGrad)" />
        <rect x="20" y="25" width="6" height="3" rx="1" fill="url(#codeGrad)" />
        <rect x="29" y="25" width="25" height="3" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="25" y="32" width="15" height="3" rx="1" fill="url(#codeGrad)" />
        <rect x="43" y="32" width="18" height="3" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="20" y="39" width="10" height="3" rx="1" fill="url(#codeGrad)" />
        <path d="M70,20 L75,25 L70,30" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
        <path d="M80,20 L85,25 L80,30" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
      </g>
    ),
    mcq: (
      <g>
        <defs>
          <linearGradient id="mcqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="3"
          fill="url(#mcqGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect x="28" y="17" width="25" height="2" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="28" y="21" width="20" height="2" rx="1" fill="currentColor" fillOpacity="0.08" />
        <circle
          cx="20"
          cy="35"
          r="3"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect x="28" y="32" width="30" height="2" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="28" y="36" width="22" height="2" rx="1" fill="currentColor" fillOpacity="0.08" />
        <circle
          cx="20"
          cy="50"
          r="3"
          fill="url(#mcqGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect x="28" y="47" width="28" height="2" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="28" y="51" width="18" height="2" rx="1" fill="currentColor" fillOpacity="0.08" />
      </g>
    ),
  }
  const defaultPattern = (
    <g>
      <circle cx="20" cy="20" r="4" fill="currentColor" fillOpacity="0.08" />
      <circle cx="50" cy="25" r="3" fill="currentColor" fillOpacity="0.12" />
      <circle cx="80" cy="30" r="5" fill="currentColor" fillOpacity="0.06" />
      <circle cx="30" cy="45" r="3.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="70" cy="50" r="4" fill="currentColor" fillOpacity="0.08" />
    </g>
  )
  const patternElement = patterns[quizType as keyof typeof patterns] || defaultPattern
  return (
    <svg
      className={`absolute right-1 bottom-1 sm:right-2 sm:bottom-2 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-20 opacity-40 group-hover:opacity-60 transition-all duration-500 ${colorScheme.pattern}`}
      viewBox="0 0 100 70"
      preserveAspectRatio="xMinYMin slice"
    >
      {patternElement}
    </svg>
  )
}

// Enhanced Quiz Card Component with full responsiveness
const QuizCard: React.FC<{
  quiz: any
  index: number
  isVisible: boolean
  isPrefetching?: boolean
}> = ({ quiz, index, isVisible, isPrefetching = false }) => {
  const Icon = quizTypeIcons[quiz.quizType as keyof typeof quizTypeIcons] || Brain
  const colorScheme = quizTypeColors[quiz.quizType as keyof typeof quizTypeColors] || quizTypeColors.mcq
  const difficultyColor = quiz.difficulty
    ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
    : difficultyColors.Medium

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
  }, [quiz, isPrefetching]) // [^2]

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      key={`${quiz.id}-grid`}
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      exit="exit"
      className="relative group transition-all duration-500"
      style={{
        minHeight: "320px",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: isVisible ? "auto" : "none",
        zIndex: isVisible ? 10 - index : 0,
      }}
      onMouseEnter={handlePrefetch}
    >
      {/* Enhanced glow effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${colorScheme.badge} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700 group-hover:duration-300`}
      ></div>
      <Card className="relative bg-gradient-to-br from-card via-card to-card/95 border border-border/50 group-hover:border-primary/30 transition-all duration-500 overflow-hidden h-full shadow-lg group-hover:shadow-2xl backdrop-blur-sm">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        {/* Background pattern */}
        <QuizBackgroundPattern quizType={quiz.quizType || ""} />
        <CardHeader className="space-y-2 sm:space-y-3 p-4 sm:p-6 pb-3 sm:pb-4 relative z-10">
          <div className="flex justify-between items-start">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br from-background to-muted/50 shadow-lg ${colorScheme.glow} group-hover:shadow-xl transition-all duration-300`}
            >
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${colorScheme.icon}`} />
            </motion.div>
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm"
              >
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium">{(4.2 + index * 0.1).toFixed(1)}</span>
              </motion.div>
            </div>
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
            {quiz.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${colorScheme.badge} text-xs`}>
              <span className="hidden sm:inline">
                {quizTypeLabels[quiz.quizType as keyof typeof quizTypeLabels] || quiz.quizType}
              </span>
              <span className="sm:hidden">
                {(quizTypeLabels[quiz.quizType as keyof typeof quizTypeLabels] || quiz.quizType).split(" ")[0]}
              </span>
            </Badge>
            <Badge className={`${difficultyColor} text-xs`}>{quiz.difficulty || "Medium"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-4 sm:px-6 pb-3 sm:pb-4 flex-1">
          {quiz.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed">
              {quiz.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
              <Clock className={`h-3 w-3 sm:h-4 sm:w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.duration || "5"} min</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
              <Users className={`h-3 w-3 sm:h-4 sm:w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.completionRate || 85}%</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
              <Target className={`h-3 w-3 sm:h-4 sm:w-4 ${colorScheme.icon}`} />
              <span className="font-medium hidden sm:inline">{quiz.popularity || "High"}</span>
              <span className="font-medium sm:hidden">Pop</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
              <Zap className={`h-3 w-3 sm:h-4 sm:w-4 ${colorScheme.icon}`} />
              <span className="font-medium hidden sm:inline">Interactive</span>
              <span className="font-medium sm:hidden">Live</span>
            </div>
          </div>
          {quiz.completionRate !== undefined && (
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                  <span className="hidden sm:inline">Completion Rate</span>
                  <span className="sm:hidden">Complete</span>
                </span>
                <span className="text-xs font-bold text-primary">{quiz.completionRate}%</span>
              </div>
              <div className="relative h-1.5 sm:h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorScheme.badge}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${quiz.completionRate}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="relative z-10 p-4 sm:p-6 pt-2">
          <Link
            href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes]}/${quiz.slug}`}
            className="w-full"
            prefetch={true}
          >
            <Button
              className={cn(
                "w-full group/btn relative overflow-hidden transition-all duration-500 font-semibold text-sm sm:text-base py-2 sm:py-3",
                "bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary",
                "shadow-lg hover:shadow-xl hover:shadow-primary/25 border-0",
                "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
                "after:translate-x-[-100%] after:group-hover/btn:translate-x-[100%] after:transition-transform after:duration-700",
              )}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>Start Quiz</span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
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

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error, refresh } = useRandomQuizzes(8)
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const processedQuizzes = useMemo(() => {
    if (!quizzes?.length) return []
    return quizzes.map((quiz, index) => ({
      ...quiz,
      id: quiz.id || `processed-${index}`,
      slug: quiz.slug || quiz.id || `processed-${index}`,
      title: quiz.title || "Untitled Quiz",
      quizType: quiz.quizType || "mcq",
      duration: quiz.duration || 5 + (index % 5),
      description: quiz.description || `Test your knowledge with this interactive ${quiz.quizType || "mcq"} quiz.`,
      popularity: quiz.popularity || (index % 2 === 0 ? "High" : "Medium"),
      completionRate: quiz.completionRate ?? 50 + ((index * 5) % 50),
    }))
  }, [quizzes]) // [^2]

  const displayQuizzes = useMemo(() => {
    if (!processedQuizzes?.length) return []
    let filtered = [...processedQuizzes]
    if (selectedType) {
      filtered = filtered.filter((quiz) => quiz.quizType === selectedType)
    }
    return filtered
  }, [processedQuizzes, selectedType]) // [^2]

  const nextCard = useCallback(() => {
    if (isTransitioning || displayQuizzes.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % displayQuizzes.length)
      setIsTransitioning(false)
    }, 200)
  }, [displayQuizzes.length, isTransitioning]) // [^2]

  const prevCard = useCallback(() => {
    if (isTransitioning || displayQuizzes.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev === 0 ? displayQuizzes.length - 1 : prev - 1))
      setIsTransitioning(false)
    }, 200)
  }, [displayQuizzes.length, isTransitioning]) // [^2]

  const handleRefresh = useCallback(() => {
    setIsTransitioning(true)
    refresh()
    setTimeout(() => {
      setActiveCardIndex(0)
      setIsTransitioning(false)
    }, 300)
  }, [refresh]) // [^2]

  const quizTypes = useMemo(
    () => [
      {
        key: "openended",
        label: "Open Ended",
        icon: BookOpen,
        shortLabel: "Open",
      },
      {
        key: "blanks",
        label: "Fill Blanks",
        icon: PenTool,
        shortLabel: "Blanks",
      },
      {
        key: "flashcard",
        label: "Flashcards",
        icon: StickyNote,
        shortLabel: "Flash",
      },
      { key: "code", label: "Code Quiz", icon: Code2, shortLabel: "Code" },
      { key: "mcq", label: "Multiple Choice", icon: Brain, shortLabel: "MCQ" },
    ],
    [],
  ) // [^2]

  useEffect(() => {
    setActiveCardIndex(0)
  }, [selectedType])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div 
      className="h-full flex flex-col bg-gradient-to-br from-background via-muted/5 to-muted/20 rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Enhanced Responsive Header */}
      <motion.div
        className="bg-gradient-to-r from-card via-card/90 to-card border-b border-border/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Header content - responsive layout */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-6">
              <motion.div 
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight">
                  Discover Quizzes
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
                  Interactive learning experiences tailored for you
                </p>
              </motion.div>
                          {/* Action buttons - responsive layout */}
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Filter toggle */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm px-3 py-2 bg-background/50 hover:bg-accent/80 transition-all duration-200 border-border/50"
                  >
                    {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </motion.div>
                
                {/* Refresh button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading || isTransitioning}
                    className="flex items-center gap-2 text-sm px-3 py-2 bg-background/50 hover:bg-accent/80 transition-all duration-200 border-border/50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </motion.div>
              </motion.div>
          </div>
          {/* Enhanced Responsive Filter Section */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <motion.div
                  className="flex flex-wrap gap-2 sm:gap-3 pb-3 sm:pb-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants}>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer hover:bg-primary/10 transition-all duration-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                        !selectedType
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedType(null)}
                    >
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">All Types</span>
                      <span className="sm:hidden">All</span>
                    </Badge>
                  </motion.div>
                  {quizTypes.map((type) => {
                    const colorScheme = quizTypeColors[type.key as keyof typeof quizTypeColors] || quizTypeColors.mcq
                    const Icon = type.icon
                    return (
                      <motion.div key={type.key} variants={itemVariants}>
                        <Badge
                          variant="outline"
                          className={`cursor-pointer transition-all duration-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                            selectedType === type.key
                              ? colorScheme.badge
                              : "hover:bg-primary/10 hover:shadow-md border-border/50"
                          }`}
                          onClick={() => setSelectedType(type.key)}
                        >
                          <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">{type.label}</span>
                          <span className="sm:hidden">{type.shortLabel}</span>
                        </Badge>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* Responsive Content Area */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 sm:h-96">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="relative">
                <LoadingSpinner />
              </div>
              <p className="text-muted-foreground text-sm sm:text-lg font-medium">Discovering amazing quizzes...</p>
            </motion.div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 sm:p-12 rounded-2xl border border-destructive/20 bg-destructive/5 max-w-md mx-auto"
          >
            <div className="text-destructive mb-3 sm:mb-4 text-lg sm:text-xl font-semibold">Failed to load quizzes</div>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{error.message}</p>
            <Button variant="outline" onClick={handleRefresh} className="bg-background">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        ) : displayQuizzes.length > 0 ? (
          <div className="relative">
            <>
              <div className="relative w-full max-w-sm sm:max-w-lg lg:max-w-2xl mx-auto h-80 sm:h-96 lg:h-[420px] perspective-1000">
                {/* Render all cards, only active is visible, others are hidden but mounted */}
                <div className="absolute inset-0 w-full h-full">
                  {displayQuizzes.slice(0, 6).map((quiz, index) => {
                    const isActive = index === activeCardIndex
                    const isNext = index === (activeCardIndex + 1) % displayQuizzes.length
                    const isPrev = index === (activeCardIndex - 1 + displayQuizzes.length) % displayQuizzes.length

                    return (
                      <motion.div
                        key={`${quiz.id}-grid`}
                        layoutId={`quiz-card-${quiz.id}`}
                        initial={false}
                        animate={
                          isActive
                            ? { opacity: 1, scale: 1, x: "0%", rotateY: 0, zIndex: 3 }
                            : isNext
                              ? { opacity: 0.7, scale: 0.9, x: "20%", rotateY: -5, zIndex: 2 }
                              : isPrev
                                ? { opacity: 0.7, scale: 0.9, x: "-20%", rotateY: 5, zIndex: 2 }
                                : { opacity: 0, scale: 0.8, x: "0%", rotateY: 0, zIndex: 1 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 300,
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
                        />
                      </motion.div>
                    )
                  })}
                </div>
                {displayQuizzes.length > 1 && (
                  <div className="absolute -bottom-12 sm:-bottom-16 left-0 right-0 flex justify-center items-center gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        if (!isTransitioning) {
                          setIsTransitioning(true)
                          setActiveCardIndex((prev) => (prev === 0 ? displayQuizzes.length - 1 : prev - 1))
                        }
                      }}
                      disabled={isTransitioning}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {displayQuizzes.slice(0, 6).map((_, idx) => (
                        <motion.div
                          key={idx}
                          className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                            idx === activeCardIndex
                              ? "w-6 sm:w-8 bg-primary shadow-lg shadow-primary/50"
                              : "w-1.5 sm:w-2 bg-primary/30"
                          }`}
                          whileHover={{ scale: 1.2 }}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        if (!isTransitioning) {
                          setIsTransitioning(true)
                          setActiveCardIndex((prev) => (prev + 1) % displayQuizzes.length)
                        }
                      }}
                      disabled={isTransitioning}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 sm:p-12 rounded-2xl border border-dashed border-border bg-muted/20 max-w-md mx-auto"
          >
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50" />
                <div className="absolute inset-0 h-12 w-12 sm:h-16 sm:w-16 text-primary/20 animate-pulse">
                  <Sparkles className="h-12 w-12 sm:h-16 sm:w-16" />
                </div>
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No quizzes found</h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
              {selectedType
                ? `No ${quizTypeLabels[selectedType as keyof typeof quizTypeLabels]} quizzes available right now.`
                : "No quizzes are currently available."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              {selectedType && (
                <Button variant="outline" onClick={() => setSelectedType(null)} className="bg-background text-sm">
                  View All Quizzes
                </Button>
              )}
              <Button onClick={handleRefresh} className="bg-primary hover:bg-primary/90 text-sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
