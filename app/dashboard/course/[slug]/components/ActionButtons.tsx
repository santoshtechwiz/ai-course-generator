"use client"

import React from "react"
import CourseActions from "./CourseActions"

interface ActionButtonsProps {
  slug: string
  title: string
  isOwner: boolean
  className?: string
  variant?: "default" | "compact"
}

export default function ActionButtons({ slug, title, isOwner, className = "", variant = "compact" }: ActionButtonsProps) {
  return (
    <CourseActions slug={slug} isOwner={isOwner} title={title} className={className} variant={variant} />
  )
}