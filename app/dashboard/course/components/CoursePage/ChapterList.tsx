"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { Lock, CheckCircle, BookOpen, PlayCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Chapter, FullCourseType } from "@/app/types"
import { motion, AnimatePresence } from "framer-motion"

interface ChapterListProps {
  course: FullCourseType
  onVideoSelect: (videoId: string, chapterId: number) => void
  currentVideoId: string | null
  isAuthenticated: boolean
  completedChapters: string[]
  currentChapter?: Chapter
}

export default function ChapterList({
  course,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  completedChapters,
  currentChapter,
}: ChapterListProps) {
  const [expandedUnits, setExpandedUnits] = useState<string[]>([])

  const sortedUnits = useMemo(() => {
    return [...course.courseUnits].sort((a, b) => a.id - b.id)
  }, [course.courseUnits])

  const orderedChapters = useMemo(() => {
    return sortedUnits.flatMap((unit) => unit.chapters.sort((a, b) => a.id - b.id))
  }, [sortedUnits])

  const totalChapters = orderedChapters.length

  const sortedCompletedChapters = useMemo(() => {
    return [...completedChapters].sort((a, b) => {
      const indexA = orderedChapters.findIndex((chapter) => chapter.id === a)
      const indexB = orderedChapters.findIndex((chapter) => chapter.id === b)
      return indexA - indexB
    })
  }, [completedChapters, orderedChapters])

  const progress = Math.round((sortedCompletedChapters.length / totalChapters) * 100)

  useEffect(() => {
    if (currentChapter) {
      const unitWithCurrentChapter = sortedUnits.find((unit) =>
        unit.chapters.some((chapter) => chapter.id === currentChapter.id),
      )
      if (unitWithCurrentChapter) {
        setExpandedUnits((prev) => Array.from(new Set([...prev, unitWithCurrentChapter.id.toString()])))
      }
    }
  }, [currentChapter, sortedUnits])

  const handleVideoSelect = useCallback(
    (videoId: string, chapterId: number) => {
      onVideoSelect(videoId, chapterId)
    },
    [onVideoSelect],
  )

  useEffect(() => {
    if (!currentVideoId && orderedChapters.length > 0) {
      const firstChapterWithVideo = orderedChapters.find((chapter) => chapter.videoId)
      if (firstChapterWithVideo) {
        handleVideoSelect(firstChapterWithVideo.videoId, firstChapterWithVideo.id)
      }
    }
  }, [currentVideoId, orderedChapters, handleVideoSelect])

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="text-center p-6">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Content Locked</h3>
          <p className="text-muted-foreground">Please sign in to access the course content.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col"
    >
      <div className="flex-none p-4 sm:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <h2 className="text-2xl font-bold tracking-tight text-primary">Course Content</h2>
      </div>
      <div className="flex-grow flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>
              {sortedCompletedChapters.length} of {totalChapters} chapters completed
            </span>
            <span>{progress}% complete</span>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          <Accordion type="multiple" value={expandedUnits} onValueChange={setExpandedUnits} className="space-y-4">
            <AnimatePresence>
              {sortedUnits.map((unit, unitIndex) => (
                <motion.div
                  key={`unit-${unit.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: unitIndex * 0.1 }}
                >
                  <AccordionItem
                    value={unit.id.toString()}
                    className="border bg-card rounded-lg px-4 sm:px-6 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 group">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant="secondary" className="font-normal bg-primary/10 text-primary">
                          Unit {unitIndex + 1}
                        </Badge>
                        <span className="font-semibold text-left group-hover:text-primary transition-colors">
                          {unit.name}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-4">
                      <AnimatePresence>
                        {expandedUnits.includes(unit.id.toString()) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                          >
                            {unit.chapters
                              .sort((a, b) => a.id - b.id)
                              .map((chapter, chapterIndex) => {
                                const isCompleted = completedChapters.includes(chapter.id.toString())
                                const isCurrentlyPlaying = chapter.videoId === currentVideoId
                                const isSelected = chapter.id === currentChapter?.id

                                return (
                                  <motion.button
                                    key={chapter.id}
                                    onClick={() => chapter.videoId && handleVideoSelect(chapter.videoId, chapter.id)}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-3 rounded-md transition-all duration-200",
                                      isCurrentlyPlaying && "bg-yellow-100 text-yellow-900",
                                      isSelected && !isCurrentlyPlaying && "bg-black text-white",
                                      isCompleted &&
                                        !isCurrentlyPlaying &&
                                        !isSelected &&
                                        "bg-green-100 text-green-900",
                                      !isCompleted && !isCurrentlyPlaying && !isSelected && "hover:bg-muted/50",
                                      !chapter.videoId && "opacity-50 cursor-not-allowed",
                                    )}
                                    disabled={!chapter.videoId}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <ChapterIcon
                                      isCompleted={isCompleted && !isCurrentlyPlaying}
                                      isSelected={isSelected && !isCurrentlyPlaying}
                                      isCurrentlyPlaying={isCurrentlyPlaying}
                                    />
                                    <div className="flex flex-col items-start">
                                      <span
                                        className={cn(
                                          "text-sm",
                                          isCurrentlyPlaying ? "text-yellow-700" : "text-muted-foreground",
                                        )}
                                      >
                                        Chapter {unitIndex + 1}.{chapterIndex + 1}
                                      </span>
                                      <span
                                        className={cn(
                                          "font-medium text-left",
                                          isCurrentlyPlaying
                                            ? "text-yellow-900"
                                            : isSelected
                                              ? "text-white"
                                              : "text-foreground",
                                        )}
                                      >
                                        {chapter.name}
                                      </span>
                                    </div>
                                  </motion.button>
                                )
                              })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </Accordion>
        </div>
      </div>
    </motion.div>
  )
}

interface ChapterIconProps {
  isCompleted: boolean
  isSelected: boolean
  isCurrentlyPlaying: boolean
}

const ChapterIcon = React.memo<ChapterIconProps>(({ isCompleted, isSelected, isCurrentlyPlaying }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {isCurrentlyPlaying ? (
        <PlayCircle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
      ) : isCompleted && !isCurrentlyPlaying ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
      ) : isSelected && !isCurrentlyPlaying ? (
        <BookOpen className="h-5 w-5 flex-shrink-0 text-black" />
      ) : (
        <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
      )}
    </motion.div>
  )
})

ChapterIcon.displayName = "ChapterIcon"

