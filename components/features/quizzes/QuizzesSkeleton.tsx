"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export function QuizzesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="overflow-hidden w-full h-full">
            <CardContent className="flex flex-col h-full p-6 relative">
              {/* Public/Private Badge Skeleton */}
              <Skeleton className="absolute top-4 right-4 h-6 w-16 bg-gray-200" />

              {/* Quiz Type Badge Skeleton */}
              <div className="mb-4">
                <Skeleton className="h-6 w-24 bg-gray-200" />
              </div>

              {/* Title Skeleton */}
              <Skeleton className="h-6 w-3/4 mb-2 bg-gray-200" />

              {/* Description Skeleton */}
              <Skeleton className="h-4 w-full mb-4 bg-gray-200" />
              <Skeleton className="h-4 w-4/5 mb-4 bg-gray-200" />

              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2">
                  <Skeleton className="h-5 w-5 mr-2 bg-gray-200" />
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 bg-gray-200" />
                    <Skeleton className="h-4 w-12 mt-1 bg-gray-200" />
                  </div>
                </div>
                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2">
                  <Skeleton className="h-5 w-5 mr-2 bg-gray-200" />
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 bg-gray-200" />
                    <Skeleton className="h-4 w-12 mt-1 bg-gray-200" />
                  </div>
                </div>
              </div>

              {/* Completion Rate Skeleton */}
              <div className="mb-4">
                <Skeleton className="h-4 w-1/2 mb-1 bg-gray-200" />
                <Skeleton className="h-2 w-full bg-gray-200" />
              </div>

              {/* Start Quiz Button Skeleton */}
              <Skeleton className="h-10 w-full rounded-lg bg-gray-200" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

