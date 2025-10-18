"use client"

import React, { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NeobrutalistCardProps {
  title: string
  description?: string
  metadata?: Array<{
    label: string
    value: string | number
    icon?: ReactNode
  }>
  tags?: Array<{
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }>
  image?: ReactNode
  onClick?: () => void
  className?: string
  children?: ReactNode
}

export function NeobrutalistCard({
  title,
  description,
  metadata = [],
  tags = [],
  image,
  onClick,
  className,
  children,
}: NeobrutalistCardProps) {
  return (
    <Card
      className={cn(
        "group bg-[hsl(var(--card))] border-4 border-[hsl(var(--border))] rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.9)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.9)] transition-all duration-200 hover:scale-[1.02] cursor-pointer",
        onClick && "hover:border-[hsl(var(--primary))]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Image */}
        {image && (
          <div className="mb-4 rounded-xl overflow-hidden border-2 border-[hsl(var(--border))]">
            {image}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-black text-[hsl(var(--foreground))] leading-tight mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium leading-relaxed mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {metadata.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--muted-foreground))]">
                {item.icon && <span className="text-[hsl(var(--primary))]">{item.icon}</span>}
                <span>{item.label}:</span>
                <span className="text-[hsl(var(--foreground))]">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant={tag.variant || "secondary"}
                className="px-3 py-1 text-xs font-bold bg-[hsl(var(--secondary))] border-2 border-[hsl(var(--border))] shadow-[2px_2px_0_0_rgba(0,0,0,0.9)]"
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Custom Content */}
        {children}
      </CardContent>
    </Card>
  )
}