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
          const colors = CATEGORY_COLORS[c.id] || CATEGORY_COLORS.programming // fallback
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
                "transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder} ${colors.glow} shadow-lg`
                  : `${colors.bg} ${colors.hoverBg} ${colors.border} ${colors.text} hover:shadow-md`,
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
                      ? "bg-white/20 border-white/30 text-white"
                      : "bg-black/10 border-black/20 text-black/70 dark:bg-white/10 dark:border-white/20 dark:text-white/70",
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

// Enhanced color configurations for each category
const CATEGORY_COLORS: Record<string, {
  bg: string
  hoverBg: string
  border: string
  text: string
  activeBg: string
  activeText: string
  activeBorder: string
  glow: string
}> = {
  programming: {
    bg: "bg-blue-500/10",
    hoverBg: "hover:bg-blue-500/20",
    border: "border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-blue-500",
    activeText: "text-white",
    activeBorder: "border-blue-500",
    glow: "shadow-blue-500/25"
  },
  "web-development": {
    bg: "bg-cyan-500/10",
    hoverBg: "hover:bg-cyan-500/20",
    border: "border-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    activeBg: "bg-cyan-500",
    activeText: "text-white",
    activeBorder: "border-cyan-500",
    glow: "shadow-cyan-500/25"
  },
  "data-science": {
    bg: "bg-yellow-500/10",
    hoverBg: "hover:bg-yellow-500/20",
    border: "border-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
    activeBg: "bg-yellow-500",
    activeText: "text-white",
    activeBorder: "border-yellow-500",
    glow: "shadow-yellow-500/25"
  },
  devops: {
    bg: "bg-gray-500/10",
    hoverBg: "hover:bg-gray-500/20",
    border: "border-gray-500/20",
    text: "text-gray-600 dark:text-gray-400",
    activeBg: "bg-gray-500",
    activeText: "text-white",
    activeBorder: "border-gray-500",
    glow: "shadow-gray-500/25"
  },
  "cloud-computing": {
    bg: "bg-sky-500/10",
    hoverBg: "hover:bg-sky-500/20",
    border: "border-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
    activeBg: "bg-sky-500",
    activeText: "text-white",
    activeBorder: "border-sky-500",
    glow: "shadow-sky-500/25"
  },
  "version-control": {
    bg: "bg-orange-500/10",
    hoverBg: "hover:bg-orange-500/20",
    border: "border-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    activeBg: "bg-orange-500",
    activeText: "text-white",
    activeBorder: "border-orange-500",
    glow: "shadow-orange-500/25"
  },
  "software-architecture": {
    bg: "bg-violet-500/10",
    hoverBg: "hover:bg-violet-500/20",
    border: "border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    activeBg: "bg-violet-500",
    activeText: "text-white",
    activeBorder: "border-violet-500",
    glow: "shadow-violet-500/25"
  },
  design: {
    bg: "bg-purple-500/10",
    hoverBg: "hover:bg-purple-500/20",
    border: "border-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    activeBg: "bg-purple-500",
    activeText: "text-white",
    activeBorder: "border-purple-500",
    glow: "shadow-purple-500/25"
  },
  business: {
    bg: "bg-amber-500/10",
    hoverBg: "hover:bg-amber-500/20",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    activeBorder: "border-amber-500",
    glow: "shadow-amber-500/25"
  },
  marketing: {
    bg: "bg-green-500/10",
    hoverBg: "hover:bg-green-500/20",
    border: "border-green-500/20",
    text: "text-green-600 dark:text-green-400",
    activeBg: "bg-green-500",
    activeText: "text-white",
    activeBorder: "border-green-500",
    glow: "shadow-green-500/25"
  },
  education: {
    bg: "bg-accent/10",
    hoverBg: "hover:bg-accent/20",
    border: "border-accent/20",
    text: "text-accent-foreground",
    activeBg: "bg-accent",
    activeText: "text-accent-foreground",
    activeBorder: "border-accent",
    glow: "shadow-accent/25"
  },
  photography: {
    bg: "bg-indigo-500/10",
    hoverBg: "hover:bg-indigo-500/20",
    border: "border-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    activeBg: "bg-indigo-500",
    activeText: "text-white",
    activeBorder: "border-indigo-500",
    glow: "shadow-indigo-500/25"
  },
  music: {
    bg: "bg-pink-500/10",
    hoverBg: "hover:bg-pink-500/20",
    border: "border-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
    activeBg: "bg-pink-500",
    activeText: "text-white",
    activeBorder: "border-pink-500",
    glow: "shadow-pink-500/25"
  },
  health: {
    bg: "bg-teal-500/10",
    hoverBg: "hover:bg-teal-500/20",
    border: "border-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    activeBg: "bg-teal-500",
    activeText: "text-white",
    activeBorder: "border-teal-500",
    glow: "shadow-teal-500/25"
  },
}

export default CategoryTagCloud
