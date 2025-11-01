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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black uppercase tracking-tight text-[hsl(var(--foreground))]">Reviews</h3>
        {status.rating ? (
          <span className="text-xs font-bold text-[hsl(var(--foreground))]/60">Your rating: {status.rating}/5</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 mb-4">
        {[1,2,3,4,5].map((i) => (
          <button
            key={i}
            className={cn(
              "p-2 rounded-md border-2 transition-all hover:scale-110",
              (hover ?? status.rating ?? 0) >= i 
                ? "text-amber-500 bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700" 
                : "text-[hsl(var(--foreground))]/30 border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/60"
            )}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => handleRating(i)}
            aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
            disabled={loading === "rating"}
          >
            <Star className={cn("h-6 w-6", (hover ?? status.rating ?? 0) >= i ? "fill-current" : "")} />
          </button>
        ))}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        disabled 
        className="w-full sm:w-auto font-bold uppercase tracking-wide text-xs opacity-60 rounded-md"
      >
        Write a review (coming soon)
      </Button>
    </div>
  )
}