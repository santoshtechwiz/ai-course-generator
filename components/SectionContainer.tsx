import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionContainerProps {
  children: ReactNode
  className?: string
  id?: string
  fullWidth?: boolean
  noPadding?: boolean
  background?: "default" | "muted" | "primary" | "accent"
}

export default function SectionContainer({
  children,
  className,
  id,
  fullWidth = false,
  noPadding = false,
  background = "default",
}: SectionContainerProps) {
  const bgClasses = {
    default: "bg-background",
    muted: "bg-muted",
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
  }

  return (
    <section id={id} className={cn(bgClasses[background], "w-full", className)}>
      <div className={cn(!noPadding && "section-spacing", !fullWidth && "content-container")}>{children}</div>
    </section>
  )
}

