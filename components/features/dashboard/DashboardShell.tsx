import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/tailwindUtils"

interface DashboardShellProps {
  children: ReactNode
  title?: string
  description?: string
  showHeader?: boolean
  isLoading?: boolean
  className?: string
}

export const DashboardShell = ({
  children,
  title,
  description,
  showHeader = true,
  isLoading = false,
  className,
}: DashboardShellProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="flex flex-col space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
              {description && <p className="text-muted-foreground">{description}</p>}
            </>
          )}
        </div>
      )}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default DashboardShell
