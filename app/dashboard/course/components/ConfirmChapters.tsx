"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"


import { Button, buttonVariants } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import ChapterCard, { ChapterCardHandler } from "./ChapterCardHandler"

export type CourseProps = {
  course: Course & {
    units: (CourseUnit & {
      chapters: Chapter[]
    })[]
  }
}

const ConfirmChapters = ({ course }: CourseProps) => {
  const [loading, setLoading] = useState(false)
  const chapterRefs = useRef<Record<string, React.RefObject<ChapterCardHandler>>>({})
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set())

  // Initialize refs for all chapters
  useEffect(() => {
    course.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => {
        if (!chapterRefs.current[chapter.id]) {
          chapterRefs.current[chapter.id] = React.createRef()
        }
      })
    })
  }, [course])

  const totalChaptersCount = useMemo(() => {
    return course.units.reduce((acc, unit) => {
      return acc + unit.chapters.length
    }, 0)
  }, [course.units])

  const progress = (completedChapters.size / totalChaptersCount) * 100

  const handleChapterComplete = useCallback((chapterId: string) => {
    setCompletedChapters((prev) => new Set(prev).add(chapterId))
  }, [])

  const allChaptersCompleted = completedChapters.size === totalChaptersCount

  const handleGenerateAll = useCallback(() => {
    setLoading(true)
    Object.values(chapterRefs.current).forEach((ref) => {
      ref.current?.triggerLoad()
    })
  }, [])

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="flex-none p-4 sm:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {course.name}
          </h1>
        </div>
        <div className="space-y-1">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {completedChapters.size} of {totalChaptersCount} chapters completed
          </p>
        </div>
      </div>
      <ScrollArea className="flex-grow px-4 sm:px-6">
        <div className="space-y-8 py-6">
          {course.units.map((unit, unitIndex) => (
            <div key={unit.id}>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Unit {unitIndex + 1}
              </h2>
              <h3 className="text-xl font-bold mb-3">{unit.name}</h3>
              <div className="space-y-3">
                {unit.chapters.map((chapter, chapterIndex) => (
                  <ChapterCard
                    key={chapter.id}
                    ref={chapterRefs.current[chapter.id]}
                    chapter={chapter}
                    chapterIndex={chapterIndex}
                    onChapterComplete={handleChapterComplete}
                    isCompleted={completedChapters.has(chapter.id.toString())}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex-none p-4 sm:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/create"
            className={buttonVariants({
              variant: "outline",
            })}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          {allChaptersCompleted ? (
            <Link
              className={buttonVariants({
                className: "font-semibold",
              })}
              href={`/dashboard/course/${course.slug}`}
            >
              Save & Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          ) : (
            <Button type="button" className="font-semibold" disabled={loading} onClick={handleGenerateAll}>
              {loading ? "Generating..." : "Generate All"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfirmChapters

