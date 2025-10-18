"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Common animation variants
export const cardAnimationVariants = {
  initial: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95 
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      staggerChildren: 0.1,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25 
    },
  },
}

export interface EnhancedCardProps {
  /** Title of the card */
  title: string
  /** Description shown below the title */
  description: string
  /** URL for the card's image */
  imageUrl?: string
  /** URL for the card's link */
  href: string
  /** Difficulty level for color coding */
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  /** Category or type badge */
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "success" | "outline"
  }
  /** Any additional badges */
  extraBadges?: Array<{
    text: string
    variant?: "default" | "secondary" | "destructive" | "success" | "outline"
  }>
  /** Progress percentage (0-100) */
  progress?: number
  /** Whether the item is marked as premium */
  isPremium?: boolean
  /** Whether the item is popular */
  isPopular?: boolean
  /** Statistics to show (e.g., duration, students, etc.) */
  stats?: Array<{
    icon: React.FC<{ className?: string }>
    value: string | number
    label: string
    tooltip?: string
  }>
  /** Optional footer content */
  footer?: React.ReactNode
  /** Loading state */
  isLoading?: boolean
  /** Additional class names */
  className?: string
  /** Click handler */
  onClick?: () => void
}

export function EnhancedCard({
  title,
  description,
  imageUrl,
  href,
  difficulty,
  badge,
  extraBadges,
  progress,
  isPremium,
  isPopular,
  stats,
  footer,
  isLoading,
  className,
  onClick,
}: EnhancedCardProps) {
  // Default difficulty colors
  const difficultyConfig = {
    Beginner: "from-success to-success",
    Intermediate: "from-warning to-warning",
    Advanced: "from-destructive to-destructive",
  }

  const cardContent = (
    <Card 
      className={cn(
        "group overflow-hidden border transition-all duration-300",
        "hover:border-primary/50 hover:shadow-lg",
        isLoading && "opacity-70 pointer-events-none",
        className
      )}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative aspect-video overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-muted" />
        
        {/* Image */}
        <Image
          src={imageUrl || "/api/placeholder"}
          alt={`${title} thumbnail`}
          fill
          className={cn(
            "object-cover transition-transform duration-300",
            "group-hover:scale-105 group-hover:brightness-105"
          )}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {/* Main Badge */}
          {badge && (
            <Badge 
              className={cn(
                "px-3 py-1 rounded-sm text-xs font-bold border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]",
                difficulty && difficultyConfig[difficulty]
              )}
            >
              {badge.text}
            </Badge>
          )}

          {/* Extra Badges */}
          {extraBadges?.map((extraBadge, idx) => (
            <Badge 
              key={idx}
              variant={extraBadge.variant}
              className="px-3 py-1 rounded-full text-xs font-semibold"
            >
              {extraBadge.text}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* Progress Bar */}
        {typeof progress === "number" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progress</span>
              <Badge variant="secondary" className="font-medium">
                {Math.round(progress)}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <TooltipProvider>
              <div className="flex items-center gap-4">
                {stats.map((stat, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <div className="p-1 rounded-md bg-accent/50">
                          <stat.icon className="h-3.5 w-3.5" />
                        </div>
                        <span>{stat.value}</span>
                      </div>
                    </TooltipTrigger>
                    {stat.tooltip && (
                      <TooltipContent>{stat.tooltip}</TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Optional Footer */}
        {footer && (
          <CardFooter className="px-0 pb-0">
            {footer}
          </CardFooter>
        )}
      </div>
    </Card>
  )

  // Wrap with motion if we have a click handler
  if (onClick) {
    return (
      <motion.div
        variants={cardAnimationVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        {cardContent}
      </motion.div>
    )
  }

  // Otherwise, wrap with Link if we have an href
  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
