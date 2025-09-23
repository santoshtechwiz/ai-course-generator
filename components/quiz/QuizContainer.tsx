import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

type QuizContainerProps = {
  children: ReactNode
  className?: string
}

export const QuizContainer = ({ children, className }: QuizContainerProps) => {
  return (
    <Card className={cn(
      "w-full max-w-4xl mx-auto p-6 space-y-6 bg-white/50 backdrop-blur-sm dark:bg-gray-950/50",
      className
    )}>
      {children}
    </Card>
  )
}

QuizContainer.displayName = "QuizContainer"