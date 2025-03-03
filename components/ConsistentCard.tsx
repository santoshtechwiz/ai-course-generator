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
      className={cn("card-standard overflow-hidden", interactive && "cursor-pointer interactive-hover", className)}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className={cn("card-spacing pb-2", headerClassName)}>
          {title && <CardTitle className="heading-3">{title}</CardTitle>}
          {description && <CardDescription className="body-small mt-1">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("card-spacing pt-2", contentClassName)}>{children}</CardContent>
      {footer && <CardFooter className={cn("card-spacing border-t bg-muted/10", footerClassName)}>{footer}</CardFooter>}
    </Card>
  )
}

