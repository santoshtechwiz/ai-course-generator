"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { cn, getColorClasses } from "@/lib/utils"

interface QuizzesSkeletonProps {
  itemCount?: number
}

export function QuizzesSkeleton({ itemCount = 6 }: QuizzesSkeletonProps) {
  const { cardPrimary } = getColorClasses()

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-4">
          <Skeleton className={cn("h-12 w-72 rounded-xl", cardPrimary)} />
          <Skeleton className={cn("h-6 w-56 rounded-lg", cardPrimary)} />
        </div>
        <Skeleton className={cn("h-14 w-40 rounded-xl", cardPrimary)} />
      </div>

      <Card className={cn(cardPrimary, "rounded-xl")}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className={cn("h-8 w-48 rounded-xl", cardPrimary)} />
            <Skeleton className={cn("h-10 w-24 rounded-full", cardPrimary)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn("text-center p-5 rounded-xl", cardPrimary)}
              >
                <Skeleton className={cn("h-12 w-12 mx-auto mb-4 rounded-xl", cardPrimary)} />
                <Skeleton className={cn("h-5 w-24 mx-auto rounded-lg", cardPrimary)} />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: itemCount }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card className={cn("h-full overflow-hidden rounded-xl", cardPrimary)}>
              <div className="h-3 bg-gradient-to-r from-primary via-accent to-secondary animate-pulse border-b-3 border-border" />

              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className={cn("h-16 w-16 rounded-xl", cardPrimary)} />
                    <div className="space-y-3">
                      <Skeleton className={cn("h-7 w-28 rounded-lg", cardPrimary)} />
                      <Skeleton className={cn("h-5 w-36 rounded-lg", cardPrimary)} />
                    </div>
                  </div>
                  <Skeleton className={cn("h-12 w-12 rounded-xl", cardPrimary)} />
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6">
                <div className="space-y-4">
                  <Skeleton className={cn("h-8 w-full rounded-lg", cardPrimary)} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className={cn("h-6 w-6 rounded", cardPrimary)} />
                      <Skeleton className={cn("h-6 w-14 rounded-lg", cardPrimary)} />
                      <Skeleton className={cn("h-5 w-20 rounded-lg", cardPrimary)} />
                    </div>
                    <Skeleton className={cn("h-6 w-24 rounded-lg", cardPrimary)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Skeleton className={cn("h-5 w-full rounded-lg", cardPrimary)} />
                  <Skeleton className={cn("h-5 w-4/5 rounded-lg", cardPrimary)} />
                </div>

                <div className="grid grid-cols-3 gap-4 py-5 border-y-3 border-border">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <Skeleton className={cn("h-10 w-10 rounded-xl", cardPrimary)} />
                      <Skeleton className={cn("h-4 w-14 rounded-lg", cardPrimary)} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Skeleton className={cn("h-6 w-28 rounded-lg", cardPrimary)} />
                  <Skeleton className={cn("h-6 w-32 rounded-lg", cardPrimary)} />
                </div>

                <Skeleton className={cn("h-3 w-full rounded-full", cardPrimary)} />
              </CardContent>

              <CardFooter className="pt-0 px-6 pb-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-5">
                    <Skeleton className={cn("h-6 w-20 rounded-lg", cardPrimary)} />
                    <Skeleton className={cn("h-7 w-24 rounded-full", cardPrimary)} />
                  </div>
                  <Skeleton className={cn("h-11 w-32 rounded-xl", cardPrimary)} />
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
