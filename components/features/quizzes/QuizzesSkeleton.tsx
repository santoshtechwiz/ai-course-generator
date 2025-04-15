"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { memo } from "react"

interface QuizzesSkeletonProps {
  itemCount?: number
}

function QuizzesSkeletonComponent({ itemCount = 6 }: QuizzesSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(itemCount)].map((_, index) => (
        <div
          key={index}
          className="will-change-transform"
          style={{
            opacity: 0,
            animation: `fadeIn 0.3s ease-out ${index * 0.05}s forwards`,
          }}
        >
          <Card className="overflow-hidden w-full h-full border-0 shadow-md">
            <CardContent className="flex flex-col h-full p-6 relative">
              {/* Quiz Type Badge Skeleton */}
              <div className="mb-4 flex">
                <Skeleton className="h-6 w-32 rounded-full bg-muted" />
                {/* Public/Private Badge Skeleton */}
                <Skeleton className="absolute top-4 right-4 h-6 w-20 rounded-full bg-muted" />
              </div>

              {/* Illustration Skeleton */}
              <Skeleton className="h-32 w-full rounded-md bg-muted mb-4" />

              {/* Title Skeleton */}
              <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
              <Skeleton className="h-6 w-1/2 mb-4 bg-muted" />

              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-2 gap-3 text-sm my-4">
                <div className="flex items-center justify-center bg-muted/30 rounded-lg p-2.5">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full bg-muted" />
                  <div className="text-center">
                    <Skeleton className="h-5 w-8 mb-1 bg-muted" />
                    <Skeleton className="h-3 w-16 bg-muted" />
                  </div>
                </div>
                <div className="flex items-center justify-center bg-muted/30 rounded-lg p-2.5">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full bg-muted" />
                  <div className="text-center">
                    <Skeleton className="h-5 w-8 mb-1 bg-muted" />
                    <Skeleton className="h-3 w-16 bg-muted" />
                  </div>
                </div>
              </div>

              {/* Completion Rate Skeleton */}
              <div className="mb-6 mt-auto">
                <div className="flex justify-between items-center mb-1.5">
                  <Skeleton className="h-4 w-20 bg-muted" />
                  <Skeleton className="h-4 w-8 bg-muted" />
                </div>
                <Skeleton className="h-1.5 w-full bg-muted" />
              </div>

              {/* Start Quiz Button Skeleton */}
              <Skeleton className="h-10 w-full rounded-md bg-muted" />
            </CardContent>
          </Card>
        </div>
      ))}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export const QuizzesSkeleton = memo(QuizzesSkeletonComponent)
