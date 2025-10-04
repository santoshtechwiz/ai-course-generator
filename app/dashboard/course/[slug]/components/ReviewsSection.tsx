"use client"

import React, { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCourseActions } from "@/hooks/useCourseActions"

interface ReviewsSectionProps {
  slug: string
}

export default function ReviewsSection({ slug }: ReviewsSectionProps) {
  const { status, handleRating, loading } = useCourseActions({ slug })
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="mt-8 rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Reviews</h3>
        {status.rating ? (
          <span className="text-xs text-muted-foreground">Your rating: {status.rating}/5</span>
        ) : null}
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1,2,3,4,5].map((i) => (
          <button
            key={i}
            className={cn("p-1 rounded", (hover ?? status.rating ?? 0) >= i && "text-amber-500")}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => handleRating(i)}
            aria-label={`Rate ${i} star`}
            disabled={loading === "rating"}
          >
            <Star className={cn("h-5 w-5", (hover ?? status.rating ?? 0) >= i ? "fill-current" : "")} />
          </button>
        ))}
      </div>
      <Button variant="outline" size="sm" disabled className="opacity-60">Write a review (coming soon)</Button>
    </div>
  )
}