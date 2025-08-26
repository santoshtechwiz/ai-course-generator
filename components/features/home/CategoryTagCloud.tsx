"use client"

import React, { useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { categories } from "@/config/categories"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CategoryTagCloudProps {
  className?: string
  // Optional external selection override
  selectedCategory?: string | null
  // Optional callback when a category is selected
  onSelect?: (id: string | null) => void
  // Map of category id -> count for weighting
  counts?: Record<string, number>
  // Whether to show a clear button
  enableClear?: boolean
}

// Weighting helpers
function computeWeights(counts: Record<string, number> | undefined) {
  if (!counts) return {}
  const values = Object.values(counts).filter((v) => v > 0)
  if (!values.length) return {}
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const weights: Record<string, number> = {}
  Object.entries(counts).forEach(([k, v]) => {
    // Normalize 0..1 then scale 0.7..1.4
    const norm = (v - min) / range
    weights[k] = 0.7 + norm * 0.7
  })
  return weights
}

export function CategoryTagCloud({
  className,
  selectedCategory,
  onSelect,
  counts,
  enableClear = true,
}: CategoryTagCloudProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const internalSelected = selectedCategory ?? searchParams.get("category") ?? null
  const weights = useMemo(() => computeWeights(counts), [counts])

  function handleSelect(id: string | null) {
    if (onSelect) onSelect(id)
    // Update URL query for integration with existing pages
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set("category", id)
    else params.delete("category")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <aside className={cn("space-y-4", className)} aria-label="Course categories tag cloud">
      <div className="flex items-center justify-between pr-1">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">Categories</h3>
        {enableClear && internalSelected && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm px-1"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = internalSelected === c.id
          const weight = weights[c.id] ?? 1
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => handleSelect(active ? null : c.id)}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: `${Math.min(1.6, Math.max(0.75, weight))}rem` }}
              className={cn(
                "relative px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                "transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background/60 hover:bg-muted border-border/50 text-foreground/80",
              )}
              aria-pressed={active}
            >
              <c.icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-70")} />
              <span className="leading-none whitespace-nowrap">{c.label}</span>
              {counts?.[c.id] !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md border",
                    active
                      ? "bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground"
                      : "bg-muted/60 border-border/40 text-muted-foreground",
                  )}
                >
                  {counts[c.id]}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </aside>
  )
}

export default CategoryTagCloud
