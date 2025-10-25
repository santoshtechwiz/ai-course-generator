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
        "relative space-y-3 rounded-2xl border-4 border-border bg-card p-3 sm:p-4 shadow-[6px_6px_0px_0px_hsl(var(--border))]",
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </section>
  )
}