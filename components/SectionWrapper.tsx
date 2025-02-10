import type React from "react"
import { cn } from "@/lib/utils"

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  container?: boolean
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  children,
  className,
  id,
  spacing = "none",
  container = true,
}) => {
  const spacingClasses = {
    none: "",
    xs: "py-2 md:py-3 lg:py-4",
    sm: "py-4 md:py-6 lg:py-8",
    md: "py-6 md:py-8 lg:py-12",
    lg: "py-8 md:py-12 lg:py-16",
    xl: "py-12 md:py-16 lg:py-24",
  }

  return (
    <section
      id={id}
      className={cn(
        "w-full",
        container && "px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16",
        container && "max-w-8xl mx-auto",
        spacingClasses[spacing],
        className,
      )}
    >
      {children}
    </section>
  )
}

export default SectionWrapper

