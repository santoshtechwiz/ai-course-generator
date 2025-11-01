"use client"

import React, { memo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sparkles, BookOpen, Target, Plus, Search, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
  canUseChat: boolean
}

const AnimatedQuestions = memo(() => {
  const questions = React.useMemo(() => [
    "How do I enroll in a course?",
    "What are the prerequisites for Machine Learning?",
    "Can you explain data normalization?",
    "How do I submit assignments?",
    "What's supervised vs unsupervised learning?",
    "How can I improve my coding skills?",
  ], [])

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [questions.length])

  return (
    <div className="h-8 overflow-hidden">
      <motion.div
        key={currentQuestionIndex}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-sm text-muted-foreground text-center"
      >
        {questions[currentQuestionIndex]}
      </motion.div>
    </div>
  )
})

AnimatedQuestions.displayName = 'AnimatedQuestions'

const WelcomeScreen = memo(({ onSuggestionClick, canUseChat }: WelcomeScreenProps) => {
  const suggestions = React.useMemo(() => [
    { text: "Show me Python courses", icon: BookOpen, color: "text-success", href: "/dashboard/courses" },
    { text: "What can I learn here?", icon: Sparkles, color: "text-primary" },
    { text: "Help me find JavaScript tutorials", icon: Search, color: "text-accent", href: "/dashboard/courses" },
    { text: "Show available quizzes", icon: Target, color: "text-warning", href: "/dashboard/quizzes" },
  ], [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full text-center p-4 space-y-6"
    >
      {/* Animated Logo/Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
        className="relative"
      >
        <div className="bg-primary/20 p-4 rounded-full relative border-4 border-primary shadow-neo">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary/20 rounded-full"
        />
      </motion.div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="font-semibold text-lg"
        >
          Welcome! How can I assist you today?
        </motion.h3>
        <AnimatedQuestions />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md"
      >
        {suggestions.map((suggestion, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
          >
            <Button
              variant="outline"
              className={cn(
                "text-sm justify-start h-auto py-3 text-left w-full transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                "border-4 border-border bg-background",
                "min-h-[48px]" // Touch-friendly
              )}
              onClick={() => onSuggestionClick(suggestion.text)}
              disabled={!canUseChat}
            >
              <suggestion.icon className={cn("mr-3 h-4 w-4 flex-shrink-0", suggestion.color)} />
              <span className="truncate">{suggestion.text}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Create Content CTAs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2"
      >
        <Button
          className="flex-1 gap-2 bg-primary hover:bg-primary/90 border-4 border-border shadow-neo"
          onClick={() => onSuggestionClick("Create a course")}
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-primary/50 hover:bg-primary/5"
          onClick={() => onSuggestionClick("Create a quiz")}
        >
          <Target className="h-4 w-4" />
          Create Quiz
        </Button>
      </motion.div>
    </motion.div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'

export { WelcomeScreen }