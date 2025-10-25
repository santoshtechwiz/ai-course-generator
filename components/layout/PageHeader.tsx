import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Breadcrumb } from "../breadcrumb"


interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{ title: string; href: string }>
  className?: string
  variant?: 'default' | 'hero' | 'compact'
  icon?: ReactNode
}

const PageHeader = ({
  title,
  description,
  breadcrumbs,
  className,
  variant = 'default',
  icon
}: PageHeaderProps) => {
  // Transform breadcrumbs to match Breadcrumb component's expected format
  const breadcrumbPaths = breadcrumbs?.map(item => ({
    name: item.title,
    href: item.href
  }))

  const variantStyles = {
    default: "space-y-4 pb-8",
    hero: "space-y-6 pb-12 py-8",
    compact: "space-y-2 pb-6"
  }

  return (
    <header className={cn(variantStyles[variant], className)} role="banner">
      {breadcrumbPaths && (
        <div className="mb-4">
          <Breadcrumb paths={breadcrumbPaths} />
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 flex-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl flex items-center gap-3" id="page-title">
            {icon && <span className="text-accent">{icon}</span>}
            <span className="text-foreground">
              {title}
            </span>
          </h1>
          {description && (
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl" role="doc-subtitle" aria-describedby="page-title">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  )
}

