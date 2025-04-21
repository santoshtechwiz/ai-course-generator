"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface QuizzesSkeletonProps {
  itemCount?: number
}

export function QuizzesSkeleton({ itemCount = 6 }: QuizzesSkeletonProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filter skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-md bg-gray-200" />
          <Skeleton className="h-10 w-20 rounded-md bg-gray-200" />
          <Skeleton className="h-10 w-20 rounded-md bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md bg-gray-200" />
          <Skeleton className="h-10 w-32 rounded-md bg-gray-200" />
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
            <div className="rounded-lg border bg-card overflow-hidden h-[360px]">
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                  <Skeleton className="h-6 w-16 rounded-full bg-gray-200" />
                </div>

                <Skeleton className="h-32 w-full rounded-md bg-gray-200" />

                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4 rounded-md bg-gray-200" />
                  <Skeleton className="h-4 w-full rounded-md bg-gray-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded-md bg-gray-200" />
                  <Skeleton className="h-16 rounded-md bg-gray-200" />
                </div>

                <Skeleton className="h-10 w-full rounded-md bg-gray-200" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
