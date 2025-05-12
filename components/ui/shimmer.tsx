import type React from "react"
import { cn } from "@/lib/tailwindUtils"

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Shimmer({ className, ...props }: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-transparent via-muted/10 to-transparent bg-[length:400%_100%]",
        className,
      )}
      {...props}
    />
  )
}
