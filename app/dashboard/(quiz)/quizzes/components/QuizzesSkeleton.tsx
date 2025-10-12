"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface QuizzesSkeletonProps {
  itemCount?: number
}

export function QuizzesSkeleton({ itemCount = 6 }: QuizzesSkeletonProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-5 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>

      <Card className="border-2 bg-gradient-to-br from-card via-card to-muted/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border"
              >
                <Skeleton className="h-10 w-10 mx-auto mb-3 rounded-xl" />
                <Skeleton className="h-4 w-20 mx-auto rounded-lg" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: itemCount }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card className="h-full overflow-hidden border-2 bg-gradient-to-br from-card via-card to-muted/10">
              <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />

              <CardHeader className="pb-4 pt-6 px-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-24 rounded-lg" />
                      <Skeleton className="h-4 w-32 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5">
                <div className="space-y-3">
                  <Skeleton className="h-7 w-full rounded-lg" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-12 rounded-lg" />
                      <Skeleton className="h-4 w-16 rounded-lg" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-lg" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-3 w-12 rounded-lg" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <Skeleton className="h-5 w-28 rounded-lg" />
                </div>

                <Skeleton className="h-2.5 w-full rounded-full" />
              </CardContent>

              <CardFooter className="pt-0 px-5 pb-5">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-16 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
