"use client"

import { motion } from "framer-motion"

import { LoadingCard } from "./LoadingCard"
import { UnifiedLoader } from "@/components/ui/unified-loader"

interface QuizzesSkeletonProps {
  itemCount?: number
}

export function QuizzesSkeleton({ itemCount = 6 }: QuizzesSkeletonProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filter skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <UnifiedLoader variant="skeleton" className="h-10 w-20" />
          <UnifiedLoader variant="skeleton" className="h-10 w-20" />
          <UnifiedLoader variant="skeleton" className="h-10 w-20" />
        </div>
        <div className="flex gap-2">
          <UnifiedLoader variant="skeleton" className="h-10 w-32" />
          <UnifiedLoader variant="skeleton" className="h-10 w-32" />
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
            <LoadingCard message={`Loading quiz ${i + 1}...`} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
