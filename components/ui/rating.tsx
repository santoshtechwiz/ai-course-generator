import { useState } from "react"
import { Star } from "lucide-react"

interface RatingProps {
  value: number | null
  onValueChange: (value: number) => void
}

export function Rating({ value, onValueChange }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 cursor-pointer ${
            (hoverValue || value || 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(null)}
          onClick={() => onValueChange(star)}
        />
      ))}
    </div>
  )
}

