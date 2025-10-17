import { memo } from 'react'
import { Badge } from '@/components/ui/badge'

type DifficultyBadgeProps = {
  difficulty: string
}

export const DifficultyBadge = memo(({ difficulty }: DifficultyBadgeProps) => {
  const color = {
    easy: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
    beginner: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
    medium: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
    intermediate: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
    hard: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
    advanced: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
  }[difficulty.toLowerCase()] || 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'

  return (
    <Badge variant="outline" className={color}>
      {difficulty}
    </Badge>
  )
})

DifficultyBadge.displayName = "DifficultyBadge"