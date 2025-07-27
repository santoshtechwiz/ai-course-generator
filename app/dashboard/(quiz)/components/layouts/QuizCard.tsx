"use client"

import type React from "react"

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  Star,
  Clock,
  Users,
  Target,
  Zap,
  ChevronRight,
  Heart,
  Bookmark,
  Share2,
  TrendingUp,
  Crown,
  Play,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { QuizBackgroundPattern } from "./QuizBackgroundPattern"

// Enhanced color schemes with better gradients
const quizTypeColors = {
  blanks: {
    badge: "bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/30",
    icon: "text-blue-500",
    pattern: "text-blue-400",
    glow: "shadow-blue-500/25",
    hover: "hover:shadow-blue-500/40",
    bg: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
  },
  flashcard: {
    badge:
      "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white border-0 shadow-lg shadow-orange-500/30",
    icon: "text-orange-500",
    pattern: "text-orange-400",
    glow: "shadow-orange-500/25",
    hover: "hover:shadow-orange-500/40",
    bg: "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
  },
  openended: {
    badge:
      "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/30",
    icon: "text-purple-500",
    pattern: "text-purple-400",
    glow: "shadow-purple-500/25",
    hover: "hover:shadow-purple-500/40",
    bg: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
  },
  code: {
    badge:
      "bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30",
    icon: "text-green-500",
    pattern: "text-green-400",
    glow: "shadow-green-500/25",
    hover: "hover:shadow-green-500/40",
    bg: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
  },
  mcq: {
    badge:
      "bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 text-white border-0 shadow-lg shadow-indigo-500/30",
    icon: "text-indigo-500",
    pattern: "text-indigo-400",
    glow: "shadow-indigo-500/25",
    hover: "hover:shadow-indigo-500/40",
    bg: "from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20",
  },
}

const difficultyColors = {
  Easy: "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-0 shadow-md shadow-emerald-500/25",
  Medium: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md shadow-amber-500/25",
  Hard: "bg-gradient-to-r from-rose-400 to-red-500 text-white border-0 shadow-md shadow-rose-500/25",
}

const quizTypeIcons = {
  blanks: Brain,
  flashcard: Brain,
  openended: Brain,
  code: Brain,
  mcq: Brain,
}

const quizTypeLabels = {
  blanks: "Fill Blanks",
  flashcard: "Flashcards",
  openended: "Open Ended",
  code: "Code Quiz",
  mcq: "Multiple Choice",
}

const quizTypeRoutes = {
  blanks: "dashboard/blanks",
  mcq: "dashboard/mcq",
  flashcard: "dashboard/flashcard",
  openended: "dashboard/openended",
  code: "dashboard/code",
}

interface QuizCardProps {
  quiz: any
  index: number
  isVisible: boolean
  isPrefetching?: boolean
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, index, isVisible, isPrefetching = false }) => {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(quiz.likes || 42 + index * 7)
  const [isHovered, setIsHovered] = useState(false)

  const Icon = quizTypeIcons[quiz.quizType as keyof typeof quizTypeIcons] || Brain
  const colorScheme = quizTypeColors[quiz.quizType as keyof typeof quizTypeColors] || quizTypeColors.mcq
  const difficultyColor = quiz.difficulty
    ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
    : difficultyColors.Medium

  // Enhanced prefetch with better error handling
  const handlePrefetch = useCallback(() => {
    if (isPrefetching && quiz.quizType && quiz.slug) {
      apiClient
        .get(`/api/quizzes/${quiz.quizType}/${quiz.slug}`, {
          cache: "force-cache",
          skipAuthCheck: true,
        })
        .then(() => console.log(`✅ Prefetched: ${quiz.title}`))
        .catch(() => console.debug(`⚠️ Prefetch failed: ${quiz.title}`))
    }
  }, [quiz, isPrefetching])

  // Enhanced interaction handlers
  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
    },
    [isLiked],
  )

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsBookmarked(!isBookmarked)
    },
    [isBookmarked],
  )

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (navigator.share) {
        navigator.share({
          title: quiz.title,
          text: quiz.description,
          url: window.location.href,
        })
      }
    },
    [quiz],
  )

  // Enhanced animation variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 40,
      rotateX: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: { duration: 0.3 },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  }

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const isPopular = quiz.popularity === "High" || quiz.completionRate > 80
  const isTrending = index < 2

  return (
    <motion.div
      key={`${quiz.id}-card`}
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      whileHover="hover"
      exit="exit"
      className="relative group transition-all duration-500 cursor-pointer"
      style={{
        minHeight: "380px",
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
    >
      {/* Enhanced glow effect with pulse */}
      <motion.div
        className={`absolute -inset-3 bg-gradient-to-r ${colorScheme.badge} rounded-3xl opacity-0 blur-2xl`}
        animate={{
          opacity: isHovered ? 0.3 : 0,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Trending/Popular badges with animations */}
      <AnimatePresence>
        {isTrending && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-3 -right-3 z-20"
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              <span>Trending</span>
            </div>
          </motion.div>
        )}

        {isPopular && !isTrending && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: 10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-3 -right-3 z-20"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5">
              <Crown className="h-3 w-3" />
              <span>Popular</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card
        className={`relative bg-gradient-to-br ${colorScheme.bg} border border-border/50 group-hover:border-primary/40 transition-all duration-500 overflow-hidden h-full shadow-xl group-hover:shadow-2xl backdrop-blur-sm`}
      >
        {/* Animated background overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/8"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.7 }}
        />

        {/* Background pattern */}
        <QuizBackgroundPattern quizType={quiz.quizType || ""} />

        <CardHeader className="space-y-3 p-4 sm:p-6 pb-3 relative z-10">
          <motion.div className="flex justify-between items-start" variants={childVariants}>
            {/* Enhanced icon with better animations */}
            <motion.div
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-xl bg-gradient-to-br from-background/90 to-muted/70 shadow-lg ${colorScheme.glow} group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}
            >
              <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${colorScheme.icon}`} />
            </motion.div>

            {/* Enhanced action buttons */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isLiked
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-background/80 hover:bg-red-50 text-muted-foreground hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isBookmarked
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-background/80 hover:bg-blue-50 text-muted-foreground hover:text-blue-500"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="p-2 rounded-full bg-background/80 hover:bg-green-50 text-muted-foreground hover:text-green-500 transition-all duration-300"
              >
                <Share2 className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>

          <motion.div variants={childVariants}>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
              {quiz.title}
            </CardTitle>
          </motion.div>

          <motion.div className="flex flex-wrap items-center gap-2" variants={childVariants}>
            <Badge className={`${colorScheme.badge} text-xs font-medium`}>
              <span className="hidden sm:inline">
                {quizTypeLabels[quiz.quizType as keyof typeof quizTypeLabels] || quiz.quizType}
              </span>
              <span className="sm:hidden">
                {(quizTypeLabels[quiz.quizType as keyof typeof quizTypeLabels] || quiz.quizType).split(" ")[0]}
              </span>
            </Badge>
            <Badge className={`${difficultyColor} text-xs font-medium`}>{quiz.difficulty || "Medium"}</Badge>
            {isTrending && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                Hot
              </Badge>
            )}
          </motion.div>
        </CardHeader>

        <CardContent className="relative z-10 px-4 sm:px-6 pb-4 flex-1">
          <motion.div variants={childVariants}>
            {quiz.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed">
                {quiz.description}
              </p>
            )}
          </motion.div>

          {/* Enhanced metrics with better icons and animations */}
          <motion.div className="grid grid-cols-2 gap-3 text-sm mb-4" variants={childVariants}>
            <motion.div
              className="flex items-center space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300"
              whileHover={{ x: 2 }}
            >
              <Clock className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.duration || "5"} min</span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300"
              whileHover={{ x: 2 }}
            >
              <Users className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.participants || "1.2k"}</span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300"
              whileHover={{ x: 2 }}
            >
              <Target className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium hidden sm:inline">{quiz.popularity || "High"}</span>
              <span className="font-medium sm:hidden">Pop</span>
            </motion.div>

            <motion.div
              className="flex items-center space-x-2 text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300"
              whileHover={{ x: 2 }}
            >
              <Zap className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium hidden sm:inline">Interactive</span>
              <span className="font-medium sm:hidden">Live</span>
            </motion.div>
          </motion.div>

          {/* Enhanced engagement metrics */}
          <motion.div className="space-y-3" variants={childVariants}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-muted-foreground">{likeCount} likes</span>
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(4.2 + index * 0.1) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs font-medium ml-1">{(4.2 + index * 0.1).toFixed(1)}</span>
              </div>
            </div>

            {/* Enhanced completion rate with better animation */}
            {quiz.completionRate !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                    Success Rate
                  </span>
                  <span className="text-sm font-bold text-primary">{quiz.completionRate || 75}%</span>
                </div>
                <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorScheme.badge}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${quiz.completionRate || 75}%` }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </CardContent>

        <CardFooter className="relative z-10 p-4 sm:p-6 pt-2">
          <Link
            href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes]}/${quiz.slug}`}
            className="w-full"
            prefetch={true}
          >
            <Button
              className={cn(
                "w-full group/btn relative overflow-hidden transition-all duration-500 font-semibold text-base py-3 px-6",
                "bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary",
                "shadow-xl hover:shadow-2xl hover:shadow-primary/30 border-0 rounded-xl",
                "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent",
                "after:translate-x-[-100%] after:group-hover/btn:translate-x-[100%] after:transition-transform after:duration-700",
              )}
            >
              <span className="relative z-10 flex items-center justify-center space-x-3">
                <Play className="h-5 w-5" />
                <span>Start Quiz</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </motion.div>
              </span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
