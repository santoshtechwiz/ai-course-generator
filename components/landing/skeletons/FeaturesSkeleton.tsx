"use client"

import { motion } from "framer-motion"

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

export const FeaturesSkeleton = () => {
  return (
    <div className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
        >
          <div className="h-10 bg-muted rounded-lg w-3/4 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded w-2/3 mx-auto animate-pulse" />
        </motion.div>

        {/* Features Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: APPLE_EASING
              }}
            >
              <div className="h-full bg-card rounded-2xl p-8 border border-border shadow-sm">
                {/* Icon Skeleton */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-6 animate-pulse" />

                {/* Content Skeleton */}
                <div className="h-6 bg-muted rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Skeleton */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: APPLE_EASING }}
        >
          <div className="h-5 bg-muted rounded w-1/3 mx-auto mb-6 animate-pulse" />
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-full animate-pulse">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}