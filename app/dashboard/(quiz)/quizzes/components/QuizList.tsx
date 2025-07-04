"use client"

import React, { memo, useEffect, useMemo, useState } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"
import { useInView } from "react-intersection-observer"
import { AlertCircle, FileQuestion, Search, Plus, RefreshCw, BookOpen, Code, Pen, FileText, FlaskConical, Trophy } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { QuizCard } from "./QuizCard"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/tailwindUtils"
import { QuizListItem } from "@/app/actions/getQuizes"
import type { QuizType } from "@/app/types/quiz-types"


NProgress.configure({
  minimum: 0.3,
  easing: "ease",
  speed: 500,
  showSpinner: false,
})

interface QuizListProps {
  quizzes: QuizListItem[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  isSearching: boolean
  onRetry?: () => void
  onCreateQuiz?: () => void
  activeFilter?: string
  onFilterChange?: (filter: string) => void
  quizCounts: {
    all: number
    mcq: number
    openended: number
    code: number
    blanks: number
    flashcard: number
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 20,
    },
  },
}

function QuizListComponent({
  quizzes,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  isSearching,
  onRetry,
  onCreateQuiz,
  activeFilter = "all",
  onFilterChange,
  quizCounts,
}: QuizListProps) {
  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    if (isFetchingNextPage) {
      NProgress.start()
    } else {
      NProgress.done()
    }
    return () => {
      NProgress.done()
    }
  }, [isFetchingNextPage])

  // Helper functions
  const getEstimatedTime = (questionCount: number): string => {
    const minutes = Math.max(Math.ceil(questionCount * 0.5), 1)
    return `${minutes} min`
  }

  const getQuestionCount = (quiz: { questionCount: number }): number => quiz.questionCount || 0

  // Memoize filtered quizzes for performance
  const filteredQuizzes = useMemo(
    () =>
      activeFilter === "all"
        ? quizzes
        : quizzes.filter((quiz) => quiz.quizType === activeFilter),
    [quizzes, activeFilter],
  )

  if (isLoading) {
    return <QuizzesSkeleton />
  }

  if (isError) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800 flex flex-col items-center">
        <AlertCircle className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
        <h3 className="font-semibold text-xl mb-2">Error loading quizzes</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          We couldn't load your quizzes. Please try again later.
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <motion.div
        className="text-center p-10 bg-muted/30 rounded-lg border border-muted"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {isSearching ? (
          <div className="max-w-md mx-auto">
            <motion.div
              className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Search className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-semibold mb-3">No matching quizzes found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <motion.div
              className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FileQuestion className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-semibold mb-3">No quizzes available</h3>
            <p className="text-muted-foreground mb-6">Be the first to create a quiz and share your knowledge!</p>
            <CreateCard
              title="Start Fresh"
              description="Be the first to create a quiz on this topic! It's easy and fun."
              animationDuration={2.0}
            />
          </div>
        )}
      </motion.div>
    )
  }
  // Icon mapping for quiz types
  const quizTypeIcons = {
    all: <BookOpen className="h-4 w-4" />,
    mcq: <FileQuestion className="h-4 w-4" />,
    openended: <Pen className="h-4 w-4" />,
    code: <Code className="h-4 w-4" />,
    blanks: <FileText className="h-4 w-4" />,
    flashcard: <FlaskConical className="h-4 w-4" />,
  };
  
  // Animation for the create quiz button
  const createButtonVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { 
        type: "spring",
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { scale: 0.98 }
  };
  
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {onFilterChange && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Quiz Categories</h2>
              {onCreateQuiz && (
                <motion.div 
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                  variants={createButtonVariants}
                >
                  <Button 
                    onClick={onCreateQuiz} 
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4" /> Create Quiz
                  </Button>
                </motion.div>
              )}
            </div>
            <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full">
              <TabsList className="flex flex-wrap justify-start gap-1 h-auto p-1.5 bg-muted/70">
                {Object.entries({
                  all: "All",
                  mcq: "MCQ", 
                  openended: "Open Ended", 
                  code: "Code", 
                  blanks: "Blanks", 
                  flashcard: "Flashcard"
                }).map(([value, label]) => (
                  <motion.div 
                    key={value}
                    onHoverStart={() => setHoveredTab(value)}
                    onHoverEnd={() => setHoveredTab(null)}
                    className="relative"
                  >
                    <TabsTrigger 
                      value={value} 
                      className={cn(
                        "flex items-center gap-1.5 py-2 px-3 transition-all duration-200",
                        activeFilter === value ? "shadow-md" : "hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {quizTypeIcons[value as keyof typeof quizTypeIcons]}
                        {label}
                      </span>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ 
                          scale: hoveredTab === value || activeFilter === value ? 1.05 : 0.95,
                          opacity: hoveredTab === value || activeFilter === value ? 1 : 0.9 
                        }}
                        className="flex items-center"
                      >
                        <Badge 
                          variant={activeFilter === value ? "default" : "secondary"}
                          className={cn(
                            "ml-1.5 text-xs transition-colors duration-300",
                            activeFilter === value && "bg-primary/90 text-white"
                          )}
                        >
                          {quizCounts[value as keyof typeof quizCounts]}
                        </Badge>
                      </motion.div>
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>      {/* Analytics summary - shows quiz type distribution */}
      {quizzes.length > 0 && (
        <motion.div 
          className="bg-card border rounded-xl p-4 shadow-sm mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Quiz Distribution</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{quizzes.length}</span> quizzes total
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {['mcq', 'openended', 'code', 'blanks', 'flashcard'].map((type) => (
              <motion.div
                key={type}
                className={cn(
                  "rounded-lg p-3 relative overflow-hidden",
                  type === 'mcq' && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                  type === 'openended' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
                  type === 'code' && "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
                  type === 'blanks' && "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
                  type === 'flashcard' && "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300",
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: 0.3 + (['mcq', 'openended', 'code', 'blanks', 'flashcard'].indexOf(type) * 0.1) }
                }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {quizTypeIcons[type as keyof typeof quizTypeIcons]}
                    <span className="font-medium capitalize">{
                      type === 'openended' ? 'Open Ended' : type === 'flashcard' ? 'Flashcard' : type.toUpperCase()
                    }</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + (['mcq', 'openended', 'code', 'blanks', 'flashcard'].indexOf(type) * 0.1), type: "spring" }}
                    className="text-lg font-bold"
                  >
                    {quizCounts[type as keyof typeof quizCounts]}
                  </motion.div>
                </div>
                
                <motion.div 
                  className="w-full h-1.5 bg-muted/30 rounded-full mt-3 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.div 
                    className={cn(
                      "h-full rounded-full",
                      type === 'mcq' && "bg-blue-500",
                      type === 'openended' && "bg-emerald-500",
                      type === 'code' && "bg-purple-500",
                      type === 'blanks' && "bg-amber-500",
                      type === 'flashcard' && "bg-rose-500",
                    )}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: quizCounts.all > 0 
                        ? `${(quizCounts[type as keyof typeof quizCounts] / quizCounts.all) * 100}%` 
                        : '0%' 
                    }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {filteredQuizzes.map((quiz, idx) => (
              <motion.div
                key={quiz.id}
                variants={itemVariants}
                layout
                className="h-full"
                whileHover={{ 
                  y: -8, 
                  scale: 1.02, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  transition: { type: "spring", stiffness: 400, damping: 15 } 
                }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.05 }}
              >
                <QuizCard
                  title={quiz.title}
                  description={quiz.title}
                  questionCount={getQuestionCount(quiz)}
                  isPublic={quiz.isPublic}
                  slug={quiz.slug}
                  quizType={quiz.quizType as QuizType}
                  estimatedTime={getEstimatedTime(quiz.questionCount)}
                  completionRate={Math.min(Math.max(quiz.bestScore || 0, 0), 100)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>

      {isFetchingNextPage && <QuizzesSkeleton itemCount={3} />}      {!hasNextPage && quizzes.length > 0 && (
        <motion.div
          ref={endMessageRef}
          initial={{ opacity: 0, y: 20 }}
          animate={endMessageInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mt-8 p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-muted/50"
        >
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: 0 }}
            >
              <Trophy className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
          <h3 className="font-semibold text-lg mb-1">You've seen it all!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You've explored all available quizzes in this category. Why not create your own quiz to share with the community?
          </p>
          {onCreateQuiz && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mt-4"
            >
              <Button onClick={onCreateQuiz} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Create New Quiz
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Memoize the component with a custom comparison function
export const QuizList = memo(QuizListComponent, (prevProps, nextProps) => {
  return (
    prevProps.quizzes.length === nextProps.quizzes.length &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isError === nextProps.isError &&
    prevProps.isFetchingNextPage === nextProps.isFetchingNextPage &&
    prevProps.hasNextPage === nextProps.hasNextPage &&
    prevProps.activeFilter === nextProps.activeFilter
  )
})
