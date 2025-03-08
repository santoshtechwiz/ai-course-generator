"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import ChapterCard, { type ChapterCardHandler } from "./ChapterCard"

export type CourseProps = {
  course: Course & {
    units: (CourseUnit & {
      chapters: Chapter[]
    })[]
  }
}

const ConfirmChapters = ({ course }: CourseProps) => {
  const [loading, setLoading] = useState(false)
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null)
  const chapterRefs = useRef<Record<string, React.RefObject<ChapterCardHandler>>>({})
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set())

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
    return course.units.reduce((acc, unit) => acc + unit.chapters.length, 0)
  }, [course.units])

  const progress = useMemo(
    () => (completedChapters.size / totalChaptersCount) * 100,
    [completedChapters.size, totalChaptersCount],
  )

  const handleChapterComplete = useCallback((chapterId: string) => {
    setCompletedChapters((prev) => new Set(prev).add(chapterId))
  }, [])

  const allChaptersCompleted = completedChapters.size === totalChaptersCount

  const handleGenerateAll = useCallback(async () => {
    setLoading(true)
    const allChapters = course.units.flatMap((unit) => unit.chapters)

    for (let i = 0; i < allChapters.length; i++) {
      const chapter = allChapters[i]
      if (!completedChapters.has(chapter.id)) {
        setCurrentGeneratingIndex(i)
        try {
          await chapterRefs.current[chapter.id].current?.triggerLoad()
        } catch (error) {
          console.error(`Error generating chapter ${chapter.id}:`, error)
          // Continue with the next chapter even if there's an error
        }
      }
    }

    setLoading(false)
    setCurrentGeneratingIndex(null)
  }, [course.units, completedChapters])

  useEffect(() => {
    if (!loading && completedChapters.size < totalChaptersCount) {
      handleGenerateAll()
    }
  }, [loading, completedChapters.size, totalChaptersCount, handleGenerateAll]) // Added missing dependencies

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {course.title}
          </h1>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {completedChapters.size} of {totalChaptersCount} chapters completed
          </p>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          {course.units.map((unit, unitIndex) => (
            <Card key={unit.id}>
              <CardHeader className="pb-2">
                <CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">Unit {unitIndex + 1}</span>
                  <h3 className="text-lg font-semibold mt-1">{unit.name}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unit.chapters.map((chapter, chapterIndex) => (
                  <ChapterCard
                    key={chapter.id}
                    ref={chapterRefs.current[chapter.id]}
                    chapter={chapter}
                    chapterIndex={chapterIndex}
                    onChapterComplete={handleChapterComplete}
                    isCompleted={completedChapters.has(chapter.id)}
                    isGenerating={currentGeneratingIndex === chapterIndex}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <div className="flex-none p-4 border-t">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/create">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          {allChaptersCompleted ? (
            <Button asChild>
              <Link href={`/dashboard/course/${course.slug}`}>
                Save & Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button onClick={handleGenerateAll} disabled={loading}>
              {loading ? `Generating ${completedChapters.size}/${totalChaptersCount}` : "Generate All"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfirmChapters

