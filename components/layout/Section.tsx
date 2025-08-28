import React from "react"
import { cn } from "@/lib/utils"

interface SectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  )
}
