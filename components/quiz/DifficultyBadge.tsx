import { memo } from 'react'
import { Badge } from '@/components/ui/badge'

type DifficultyBadgeProps = {
  difficulty: string
}

export const DifficultyBadge = memo(({ difficulty }: DifficultyBadgeProps) => {
  const color = {
    easy: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
    hard: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  }[difficulty.toLowerCase()] || 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'

  return (
    <Badge variant="outline" className={color}>
      {difficulty}
    </Badge>
  )
})

DifficultyBadge.displayName = "DifficultyBadge"