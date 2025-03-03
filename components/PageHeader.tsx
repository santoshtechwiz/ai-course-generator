import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
  align?: "left" | "center" | "right"
  actions?: ReactNode
}

export default function PageHeader({
  title,
  description,
  children,
  className,
  align = "left",
  actions,
}: PageHeaderProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  }

  return (
    <div className={cn("mb-8 md:mb-12", alignmentClasses[align], className)}>
      <div
        className={cn(
          "space-y-4",
          actions && "flex flex-col md:flex-row md:items-center md:justify-between md:space-y-0",
        )}
      >
        <div className={cn("space-y-2", align === "center" && "max-w-3xl mx-auto")}>
          <h1 className="heading-1">{title}</h1>
          {description && <p className="body-large text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex-shrink-0 flex gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

