import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Breadcrumb } from "../breadcrumb"


interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{ title: string; href: string }>
  className?: string
}

export const PageHeader = ({ title, description, breadcrumbs, className }: PageHeaderProps) => {
  // Transform breadcrumbs to match Breadcrumb component's expected format
  const breadcrumbPaths = breadcrumbs?.map(item => ({
    name: item.title,
    href: item.href
  }))

  return (
    <header className={cn("space-y-2 pb-8", className)} role="banner">
      {breadcrumbPaths && <Breadcrumb paths={breadcrumbPaths} />}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" id="page-title">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground" role="doc-subtitle" aria-describedby="page-title">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  )
}

export default PageHeader