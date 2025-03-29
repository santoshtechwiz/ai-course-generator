import type React from "react"
import { cn } from "@/lib/utils"

interface SectionContainerProps {
  children: React.ReactNode
  className?: string
  id?: string
  background?: "white" | "gray" | "primary" | "none"
}

export const SectionContainer = ({ children, className, id, background = "none" }: SectionContainerProps) => {
  const backgroundClasses = {
    white: "bg-white dark:bg-gray-900",
    gray: "bg-gray-50 dark:bg-gray-800",
    primary: "bg-primary/5 dark:bg-primary/10",
    none: "",
  }

  return (
    <section id={id} className={cn("py-12 md:py-16", backgroundClasses[background], className)}>
      {children}
    </section>
  )
}

