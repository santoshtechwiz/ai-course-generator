import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import neo from '@/components/neo/tokens'

type DifficultyBadgeProps = {
  difficulty: string
}

export const DifficultyBadge = memo(({ difficulty }: DifficultyBadgeProps) => {
  const color = {
    easy: 'bg-[hsl(var(--success))]/15 dark:bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] dark:text-[hsl(var(--success-foreground))] border-3 border-[hsl(var(--success))]/40 dark:border-[hsl(var(--success))]/30 font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]',
    beginner: 'bg-[hsl(var(--success))]/15 dark:bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] dark:text-[hsl(var(--success-foreground))] border-3 border-[hsl(var(--success))]/40 dark:border-[hsl(var(--success))]/30 font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]',
    medium: 'bg-[hsl(var(--primary))]/15 dark:bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] dark:text-[hsl(var(--primary-foreground))] border-3 border-[hsl(var(--primary))]/40 dark:border-[hsl(var(--primary))]/30 font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]',
    intermediate: 'bg-[hsl(var(--primary))]/15 dark:bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] dark:text-[hsl(var(--primary-foreground))] border-3 border-[hsl(var(--primary))]/40 dark:border-[hsl(var(--primary))]/30 font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]',
    hard: 'bg-[hsl(var(--destructive))]/15 dark:bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive-foreground))] border-3 border-[hsl(var(--destructive))]/40 dark:border-[hsl(var(--destructive))]/30 font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]',
    advanced: 'bg-[hsl(var(--destructive))]/15 dark:bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive-foreground))] border-3 border-[hsl(var(--destructive))]/40 dark:border-[hsl(var(--destructive))]/30 font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]',
  }[difficulty.toLowerCase()] || 'bg-muted/50 dark:bg-muted/30 text-muted-foreground border-3 border-border font-black shadow-[2px_2px_0px_0px_hsl(var(--border))]'

  return (
    <Badge variant="neutral" className={cn(neo.badge, "px-3 py-1.5 text-xs", color)}>
      {difficulty}
    </Badge>
  )
})

DifficultyBadge.displayName = "DifficultyBadge"