import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg" | "xl"
type LoaderVariant = "spinner" | "dots" | "pulse" | "skeleton"

interface LoaderProps {
  size?: LoaderSize
  variant?: LoaderVariant
  className?: string
  text?: string
  fullPage?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
}

export function Loader({ size = "md", variant = "spinner", className, text, fullPage = false }: LoaderProps) {
  const containerClasses = cn(
    "flex items-center justify-center",
    fullPage && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
    className,
  )

  const loaderClasses = cn("text-primary", sizeClasses[size])

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div className={cn("flex gap-1", loaderClasses)}>
            <div className="animate-bounce delay-0 h-2 w-2 rounded-full bg-primary"></div>
            <div className="animate-bounce delay-150 h-2 w-2 rounded-full bg-primary"></div>
            <div className="animate-bounce delay-300 h-2 w-2 rounded-full bg-primary"></div>
          </div>
        )
      case "pulse":
        return <div className={cn("animate-pulse rounded-full bg-primary/70", loaderClasses)}></div>
      case "skeleton":
        return <div className={cn("animate-pulse rounded-md bg-muted", loaderClasses)}></div>
      case "spinner":
      default:
        return (
          <div className={cn("relative", loaderClasses)}>
            <svg
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              width="100%"
              height="100%"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )
    }
  }

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        {renderLoader()}
        {text && <p className="text-sm text-muted-foreground animate-fade-in">{text}</p>}
      </div>
    </div>
  )
}

export function FullPageLoader({ text = "Loading content..." }: { text?: string }) {
  return (
    <div className="content-container flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <Loader size="lg" variant="spinner" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-foreground">{text}</h3>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-x-2 flex">
          <div className="h-10 w-[100px] bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-[100px] bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-[100px] bg-muted rounded-md animate-pulse"></div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="h-[74px] w-[120px] bg-muted rounded-md animate-pulse"></div>
          <div className="h-[74px] w-[120px] bg-muted rounded-md animate-pulse"></div>
          <div className="h-[74px] w-[120px] bg-muted rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] w-full bg-muted rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="h-[500px] w-full bg-muted rounded-md animate-pulse"></div>
      </div>
    </div>
  )
}
