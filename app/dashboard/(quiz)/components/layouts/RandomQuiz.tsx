"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Target,
  Shuffle,
  Zap,
  TrendingUp,
  Star,
  Users,
  Calendar,
  Tag
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRandomQuizzes, type RandomQuiz as RandomQuizType } from "@/hooks/useRandomQuizzes"
import { motion, AnimatePresence } from "framer-motion"

interface RandomQuizProps {
  className?: string
  showStats?: boolean
  autoRotate?: boolean
  rotateInterval?: number
}

const getQuizRoute = (quizType: string) => {
  const routes: Record<string, string> = {
    blanks: "dashboard/blanks",
    mcq: "dashboard/mcq", 
    flashcard: "dashboard/flashcard",
    openended: "dashboard/openended",
    code: "dashboard/code",
  }
  return routes[quizType] || "dashboard/mcq"
}

const QuizCard = ({ quiz, isActive }: { quiz: RandomQuizType; isActive: boolean }) => {
  if (!isActive) return null

  return (
    <motion.div
      key={quiz.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-background via-background to-accent/5 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-sm">
                  {quiz.quizType.slice(0, 2).toUpperCase()}
                </span>
              </div>
              {quiz.isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 rounded-full"
                >
                  <Zap className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">New</span>
                </motion.div>
              )}
            </motion.div>
            
            {quiz.popularity === "High" && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-full"
              >
                <TrendingUp className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Popular</span>
              </motion.div>
            )}
          </div>

          <CardTitle className="text-lg font-bold leading-tight line-clamp-2 mb-3">
            {quiz.title}
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              {quiz.quizType.charAt(0).toUpperCase() + quiz.quizType.slice(1)}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs border-2",
                quiz.difficulty === "Easy" && "border-green-300 text-green-700 bg-green-50",
                quiz.difficulty === "Medium" && "border-amber-300 text-amber-700 bg-amber-50", 
                quiz.difficulty === "Hard" && "border-red-300 text-red-700 bg-red-50"
              )}
            >
              {quiz.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {quiz.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {quiz.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
            <motion.div 
              className="flex items-center gap-2 justify-center sm:justify-start"
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="font-medium">{quiz.duration} min</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 justify-center sm:justify-start"
              whileHover={{ scale: 1.05 }}
            >
              <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="font-medium">{quiz.completionRate}%</span>
            </motion.div>
            
            {quiz.bestScore && (
              <motion.div 
                className="flex items-center gap-2 justify-center sm:justify-start sm:col-span-2"
                whileHover={{ scale: 1.05 }}
              >
                <Star className="h-4 w-4 text-amber-500 fill-current flex-shrink-0" />
                <span className="font-medium">{quiz.bestScore}%</span>
              </motion.div>
            )}
          </div>

          {quiz.tags && quiz.tags.length > 0 && (
            <div className="flex items-start gap-1 mb-2">
              <Tag className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex flex-wrap gap-1 min-w-0">
                {quiz.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-muted/60 text-muted-foreground rounded-md truncate max-w-[80px]"
                    title={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Link href={`/${getQuizRoute(quiz.quizType)}/${quiz.slug}`} className="w-full">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300">
                Start Quiz
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export const RandomQuiz = ({ 
  className, 
  showStats = true, 
  autoRotate = false, 
  rotateInterval = 8000 
}: RandomQuizProps) => {
  const { quizzes, isLoading, error, refresh, shuffleQuizzes, stats, isCached } = useRandomQuizzes(6)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate || isPaused || quizzes.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % quizzes.length)
    }, rotateInterval)

    return () => clearInterval(interval)
  }, [autoRotate, isPaused, quizzes.length, rotateInterval])

  const nextQuiz = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % quizzes.length)
  }, [quizzes.length])

  const prevQuiz = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? quizzes.length - 1 : prev - 1))
  }, [quizzes.length])

  const handleShuffle = useCallback(() => {
    shuffleQuizzes()
    setActiveIndex(0)
  }, [shuffleQuizzes])

  const handleRefresh = useCallback(() => {
    refresh()
    setActiveIndex(0)
  }, [refresh])

  if (isLoading && quizzes.length === 0) {
    return (
      <Card className={cn("w-full h-full flex items-center justify-center min-h-[300px]", className)}>
        <div className="flex flex-col items-center gap-3 p-4 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Discovering amazing quizzes...</p>
        </div>
      </Card>
    )
  }

  if (error && quizzes.length === 0) {
    return (
      <Card className={cn("w-full h-full flex items-center justify-center min-h-[300px]", className)}>
        <div className="flex flex-col items-center gap-3 text-center p-4">
          <div className="text-2xl">😅</div>
          <p className="text-sm text-muted-foreground">Couldn't load quizzes right now</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (quizzes.length === 0) {
    return (
      <Card className={cn("w-full h-full flex items-center justify-center min-h-[300px]", className)}>
        <div className="flex flex-col items-center gap-3 text-center p-4">
          <div className="text-4xl">📚</div>
          <p className="text-sm text-muted-foreground">No quizzes available at the moment</p>
        </div>
      </Card>
    )
  }

  const currentQuiz = quizzes[activeIndex]

  return (
    <Card className={cn("w-full h-full flex flex-col", className)}>
      {/* Enhanced Header */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <motion.div 
            className="flex items-center gap-3 min-w-0 flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md flex-shrink-0"
            >
              <Target className="h-4 w-4 text-primary-foreground" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">Discover Quizzes</h3>
              {showStats && (
                <p className="text-xs text-muted-foreground truncate">
                  {stats.totalQuizzes} available • {stats.newQuizzesCount} new
                </p>
              )}
            </div>
          </motion.div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCached && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-blue-700">Cached</span>
              </motion.div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShuffle}
              disabled={isLoading}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Shuffle className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Quiz Content */}
      <CardContent className="p-4 flex-1 min-h-0">
        <div 
          className="relative h-full"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <QuizCard 
              key={currentQuiz.id}
              quiz={currentQuiz} 
              isActive={true} 
            />
          </AnimatePresence>
        </div>
      </CardContent>

      {/* Enhanced Navigation */}
      {quizzes.length > 1 && (
        <CardFooter className="flex items-center justify-center gap-2 sm:gap-4 pt-0 px-2 sm:px-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevQuiz} 
              className="h-8 w-8 p-0 hover:bg-primary/10 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>

          <div className="flex items-center gap-1 overflow-hidden">
            {quizzes.slice(0, 5).map((_, index) => (
              <motion.button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0",
                  index === activeIndex 
                    ? "bg-primary w-4 sm:w-6" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                onClick={() => setActiveIndex(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              />
            ))}
            {quizzes.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">+{quizzes.length - 5}</span>
            )}
          </div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextQuiz} 
              className="h-8 w-8 p-0 hover:bg-primary/10 flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </CardFooter>
      )}

      {/* Auto-rotation indicator */}
      {autoRotate && !isPaused && quizzes.length > 1 && (
        <motion.div
          className="absolute bottom-2 right-2 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 bg-primary rounded-full" />
        </motion.div>
      )}
    </Card>
  )
}
