import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Breadcrumb } from "@/components/common"

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{ title: string; href: string }>
  className?: string
}

export const PageHeader = ({ title, description, actions, breadcrumbs, className }: PageHeaderProps) => {
  return (
    <div className={cn("space-y-2 pb-8", className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default PageHeader