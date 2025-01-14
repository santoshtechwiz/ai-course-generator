"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { categories } from "@/config/categories"

interface CategorySelectorProps {
  value?: string
  onChange?: (value: string) => void
  error?: boolean
  disabled?: boolean
}

export function CategorySelector({
  value,
  onChange,
  error,
  disabled
}: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = value === category.id
        
        return (
          <button
            key={category.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(category.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              "hover:scale-105 active:scale-100",
              category.color,
              isSelected ? "border-current ring-2 ring-primary/10" : "border-transparent",
              error ? "border-red-500" : "",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="selectedCategory"
                className="absolute inset-0 rounded-xl bg-primary/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <Icon className="w-8 h-8 text-gray-900" />
            <div className="text-sm font-medium z-10 text-gray-900">{category.label}</div>
            <div className="text-xs text-gray-500 text-center z-10">
              {category.description}
            </div>
          </button>
        )
      })}
    </div>
  )
}

