"use client"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { getCategoryById } from "@/config/categories"

interface CategoryIconProps {
  categoryId: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "gradient" | "outline"
  className?: string
  animated?: boolean
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
}

const containerSizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
  xl: "p-4",
}

export function CategoryIcon({
  categoryId,
  size = "md",
  variant = "default",
  className,
  animated = false,
}: CategoryIconProps) {
  const category = getCategoryById(categoryId)

  if (!category) {
    return null
  }

  const Icon = category.icon

  const iconElement = (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center transition-all duration-300",
        containerSizeClasses[size],
        variant === "gradient" && `bg-[var(--color-primary)] text-white shadow-neo`,
        variant === "outline" && `border-6 border-[var(--color-border)] bg-transparent`,
        variant === "default" && category.color,
        className,
      )}
    >
      <Icon className={cn(sizeClasses[size], variant === "gradient" ? "text-white" : "text-current")} />
    </div>
  )

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {iconElement}
      </motion.div>
    )
  }

  return iconElement
}

function CategoryBadge({
  categoryId,
  showIcon = true,
  className,
}: {
  categoryId: string
  showIcon?: boolean
  className?: string
}) {
  const category = getCategoryById(categoryId)

  if (!category) {
    return null
  }

  const Icon = category.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        category.color,
        className,
      )}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      {category.label}
    </div>
  )
}
