import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

type QuizContainerProps = {
  children: ReactNode
  className?: string
  questionNumber?: number
  totalQuestions?: number
  animationKey?: string
  fullWidth?: boolean
  [key: string]: any
}
export const QuizContainer = ({ children, className, ...rest }: QuizContainerProps) => {
  // Do NOT forward arbitrary custom props (like fullWidth) to the underlying Card div.
  // Forwarding unknown props causes React warnings when they reach the DOM.
  return (
    <Card className={cn(
      "w-full max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 bg-white/50 backdrop-blur-sm dark:bg-gray-950/50",
      className
    )}>
      {children}
    </Card>
  )
}

QuizContainer.displayName = "QuizContainer"