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
      "w-full max-w-4xl mx-auto shadow-neo border-6 border-border bg-card neo-hover-lift",
      className
    )}>
      {children}
    </Card>
  )
}

QuizContainer.displayName = "QuizContainer"