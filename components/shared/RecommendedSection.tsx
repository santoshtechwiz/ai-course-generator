"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface RecommendedSectionProps {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export default function RecommendedSection({ title, action, className, children }: RecommendedSectionProps) {
  return (
    <section
      className={cn(
        "relative space-y-3 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-3 sm:p-4 overflow-hidden ai-glass dark:ai-glass-dark",
        className,
      )}
      aria-label={title}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] neural-pattern" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </section>
  )
}