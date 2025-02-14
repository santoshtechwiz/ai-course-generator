"use client"
import { Star } from "lucide-react"

interface RatingProps {
  value: number | null
  onValueChange: (value: number) => void
  className?: string
}

export function Rating({ value = 0, onValueChange, className = "" }: RatingProps) {
  return (
    <div className={`ml-2 flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onValueChange(star)} className="focus:outline-none">
          <Star className={`h-5 w-5 ${(value || 0) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
        </button>
      ))}
    </div>
  )
}

