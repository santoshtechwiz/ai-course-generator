import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type DifficultyBadgeProps = {
  difficulty: string
}

export const DifficultyBadge = memo(({ difficulty }: DifficultyBadgeProps) => {
  const color = {
    easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-3 border-emerald-600 dark:border-emerald-400 font-black shadow-[2px_2px_0px_0px] shadow-emerald-600/50 dark:shadow-emerald-400/50',
    beginner: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-3 border-emerald-600 dark:border-emerald-400 font-black shadow-[2px_2px_0px_0px] shadow-emerald-600/50 dark:shadow-emerald-400/50',
    medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-3 border-blue-600 dark:border-blue-400 font-black shadow-[2px_2px_0px_0px] shadow-blue-600/50 dark:shadow-blue-400/50',
    intermediate: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-3 border-blue-600 dark:border-blue-400 font-black shadow-[2px_2px_0px_0px] shadow-blue-600/50 dark:shadow-blue-400/50',
    hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-3 border-red-600 dark:border-red-400 font-black shadow-[2px_2px_0px_0px] shadow-red-600/50 dark:shadow-red-400/50',
    advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-3 border-red-600 dark:border-red-400 font-black shadow-[2px_2px_0px_0px] shadow-red-600/50 dark:shadow-red-400/50',
  }[difficulty.toLowerCase()] || 'bg-muted dark:bg-muted/50 text-muted-foreground border-3 border-border font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]'

  return (
    <Badge variant="outline" className={cn("px-3 py-1.5 text-xs", color)}>
      {difficulty}
    </Badge>
  )
})

DifficultyBadge.displayName = "DifficultyBadge"