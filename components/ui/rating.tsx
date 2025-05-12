"use client"
import { Star } from "lucide-react"

interface RatingProps {
  value: number | null
  onValueChange: (value: number) => void
  className?: string
}

export function Rating({ value = 0, onValueChange, className = "" }: RatingProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onValueChange(star)} className="focus:outline-none p-0.5 sm:p-1">
          <Star
            className={`space-x-1 h-2 w-2 sm:h-3 sm:w-3 ${
              (value || 0) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
            }`}
          />
        </button>
      ))}
    </div>
  )
}
