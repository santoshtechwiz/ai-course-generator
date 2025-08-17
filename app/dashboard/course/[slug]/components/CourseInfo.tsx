"use client"

import React from "react"
import type { FullCourseType } from "@/app/types/types"

interface CourseInfoProps {
  course: FullCourseType
  progressPercentage?: number
}

export default function CourseInfo({ course, progressPercentage = 0 }: CourseInfoProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-semibold truncate">{course.title}</h1>
        {typeof progressPercentage === "number" && (
          <div className="text-xs text-muted-foreground mt-1">
            Progress: {Math.round(progressPercentage)}%
          </div>
        )}
      </div>
    </div>
  )
}