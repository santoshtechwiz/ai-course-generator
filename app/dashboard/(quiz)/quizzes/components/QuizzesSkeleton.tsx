"use client"

import { motion } from "framer-motion"
import { CardLoader } from "@/components/ui/loader"

interface QuizzesSkeletonProps {
  itemCount?: number
}

export function QuizzesSkeleton({ itemCount = 6 }: QuizzesSkeletonProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filter skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          <div className="h-10 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: itemCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <CardLoader message={`Loading quiz ${i + 1}...`} context="quiz" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function QuizLoadingCard() {
  return <CardLoader message="Loading quizzes..." subMessage="Fetching your quiz collection" context="quiz" />
}

export default QuizzesSkeleton
