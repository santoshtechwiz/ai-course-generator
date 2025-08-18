"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ConsistentCardProps {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
  onClick?: () => void
  interactive?: boolean
}

export default function ConsistentCard({
  title,
  description,
  children,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  onClick,
  interactive = false,
}: ConsistentCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border transition-all duration-200",
        interactive && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        className,
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className={cn("p-5 pb-3", headerClassName)}>
          {title && <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>}
          {description && (
            <CardDescription className="mt-1.5 text-sm text-muted-foreground">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("p-5 pt-3", contentClassName)}>{children}</CardContent>
      {footer && (
        <CardFooter className={cn("p-5 pt-4 border-t bg-muted/10 flex items-center", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
