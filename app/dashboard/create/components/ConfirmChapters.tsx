"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, BookOpen, Plus, Pencil, X, GripVertical, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import ChapterCard, { type ChapterCardHandler } from "./ChapterCardHandler"
import VideoPlayer from "./VideoPlayer"
import { useToast } from "@/hooks/use-toast"
import DebugPanel from "./DebugPanel"
import { cn } from "@/lib/utils"
import axios from "axios"

export type CourseProps = {
  course: Course & {
    units: (CourseUnit & {
      chapters: Chapter[]
    })[]
  }
}

const ConfirmChapters = ({ course: initialCourse }: CourseProps) => {
  const { toast } = useToast()
  const router = useRouter()
  const [course, setCourse] = useState(initialCourse)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set())
  const chapterRefs = useRef<Record<string, React.RefObject<ChapterCardHandler>>>({})
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState("")
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [currentVideoTitle, setCurrentVideoTitle] = useState("")
  const [newChapter, setNewChapter] = useState({ title: "", youtubeId: "" })
  const [addingToUnitId, setAddingToUnitId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Ensure all IDs are strings
  useEffect(() => {
    course.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => {
        const chapterId = String(chapter.id)
        if (!chapterRefs.current[chapterId]) {
          chapterRefs.current[chapterId] = React.createRef()
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

  const handleGenerateAll = useCallback(() => {
    // Mark all chapters as completed immediately without making API calls
    const allChapters = course.units.flatMap((unit) => unit.chapters)
    const newCompletedChapters = new Set(completedChapters)

    allChapters.forEach((chapter) => {
      newCompletedChapters.add(String(chapter.id))
    })

    setCompletedChapters(newCompletedChapters)
  }, [course.units, completedChapters])

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination } = result
    const sourceUnitId = source.droppableId.replace("unit-", "")
    const destUnitId = destination.droppableId.replace("unit-", "")

    // Create a deep copy of the course
    const newCourse = JSON.parse(JSON.stringify(course))

    // Find the source and destination units
    const sourceUnitIndex = newCourse.units.findIndex((unit: CourseUnit) => String(unit.id) === sourceUnitId)
    const destUnitIndex = newCourse.units.findIndex((unit: CourseUnit) => String(unit.id) === destUnitId)

    if (sourceUnitIndex === -1 || destUnitIndex === -1) {
      console.error("Could not find source or destination unit", { sourceUnitId, destUnitId })
      return
    }

    // If reordering within the same unit
    if (sourceUnitId === destUnitId) {
      const chapters = [...newCourse.units[sourceUnitIndex].chapters]
      const [removed] = chapters.splice(source.index, 1)
      chapters.splice(destination.index, 0, removed)
      newCourse.units[sourceUnitIndex].chapters = chapters
    } else {
      // Moving between units
      const sourceChapters = [...newCourse.units[sourceUnitIndex].chapters]
      const destChapters = [...newCourse.units[destUnitIndex].chapters]

      const [removed] = sourceChapters.splice(source.index, 1)
      destChapters.splice(destination.index, 0, removed)

      newCourse.units[sourceUnitIndex].chapters = sourceChapters
      newCourse.units[destUnitIndex].chapters = destChapters
    }

    setCourse(newCourse)
  }

  // Handle editing chapter title
  const startEditingChapter = (chapter: Chapter) => {
    setEditingChapterId(String(chapter.id))
    setEditingChapterTitle(chapter.title)
  }

  const saveChapterTitle = () => {
    if (!editingChapterId) return

    const newCourse = JSON.parse(JSON.stringify(course))

    for (const unit of newCourse.units) {
      const chapterIndex = unit.chapters.findIndex((ch: Chapter) => String(ch.id) === editingChapterId)
      if (chapterIndex !== -1) {
        unit.chapters[chapterIndex].title = editingChapterTitle
        break
      }
    }

    setCourse(newCourse)
    setEditingChapterId(null)
  }

  // Handle showing video
  const showVideo = (chapter: Chapter) => {
    if (chapter.videoId) {
      setCurrentVideoId(chapter.videoId)
      setCurrentVideoTitle(chapter.title)
      setShowVideoDialog(true)
    }
  }

  // Handle adding new chapter
  const startAddingChapter = (unitId: string) => {
    setAddingToUnitId(unitId)
    setNewChapter({ title: "", youtubeId: "" })
  }

  const validateYoutubeId = (id: string) => {
    // Check if it's a YouTube URL
    if (id.includes("youtube.com") || id.includes("youtu.be")) {
      try {
        const url = new URL(id)
        let videoId = ""

        if (id.includes("youtube.com")) {
          videoId = url.searchParams.get("v") || ""
        } else if (id.includes("youtu.be")) {
          videoId = url.pathname.substring(1)
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      } catch (e) {
        return false
      }
    }

    // Check if it's a direct video ID (11 characters)
    return /^[a-zA-Z0-9_-]{11}$/.test(id)
  }

  // Update the addNewChapter function to properly validate the YouTube ID

  const addNewChapter = () => {
    if (!addingToUnitId) return
    if (!newChapter.title.trim()) {
      toast({
        title: "Error",
        description: "Chapter title is required",
        variant: "destructive",
      })
      return
    }

    // Only validate YouTube ID if one was provided
    if (newChapter.youtubeId.trim() && !validateYoutubeId(newChapter.youtubeId.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube ID (11 characters)",
        variant: "destructive",
      })
      return
    }

    const newCourse = JSON.parse(JSON.stringify(course))
    const unitIndex = newCourse.units.findIndex((unit: CourseUnit) => String(unit.id) === addingToUnitId)

    if (unitIndex !== -1) {
      const newChapterId = `new-${Date.now()}`
      const youtubeId = newChapter.youtubeId.trim() || null

      newCourse.units[unitIndex].chapters.push({
        id: newChapterId,
        title: newChapter.title,
        videoId: youtubeId,
        unitId: Number(addingToUnitId),
        createdAt: new Date(),
        updatedAt: new Date(),
        youtubeSearchQuery: newChapter.title,
        videoStatus: youtubeId ? "completed" : "idle",
        summary: "Custom chapter created by user", // Mark as custom chapter
        summaryStatus: "COMPLETED",
        order: newCourse.units[unitIndex].chapters.length, // Set order based on position
        isCompleted: false,
      })

      // Create a ref for the new chapter
      chapterRefs.current[newChapterId] = React.createRef()

      // Mark the new chapter as completed if it has a video ID
      if (youtubeId) {
        setCompletedChapters((prev) => new Set(prev).add(newChapterId))
      }
    }

    setCourse(newCourse)
    setAddingToUnitId(null)

    // Reset the form
    setNewChapter({ title: "", youtubeId: "" })

    toast({
      title: "Success",
      description: "New chapter added successfully",
    })
  }

  // Save course changes before redirecting
  const saveAndContinue = async () => {
    try {
      setIsSaving(true)

      // Prepare data for API
      const updatedCourse = {
        courseId: course.id,
        slug: course.slug,
        units: course.units.map((unit) => ({
          id: unit.id,
          chapters: unit.chapters.map((chapter, index) => ({
            id: String(chapter.id).startsWith("new-") ? null : chapter.id, // null for new chapters
            title: chapter.title,
            videoId: chapter.videoId,
            unitId: unit.id,
            position: index, // This will map to 'order' in the API
            isCustom: chapter.summary?.includes("Custom chapter") || String(chapter.id).startsWith("new-"),
            youtubeSearchQuery: chapter.youtubeSearchQuery || chapter.title,
          })),
        })),
      }

      // Save the updated course structure
      await axios.post("/api/course/update-chapters", updatedCourse)

      toast({
        title: "Success",
        description: "Course structure saved successfully",
      })

      // Redirect to the course page
      router.push(`/dashboard/course/${course.slug}`)
    } catch (error) {
      console.error("Error saving course:", error)
      toast({
        title: "Error",
        description: "Failed to save course changes. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // Only run once when the component mounts
    if (completedChapters.size === 0) {
      handleGenerateAll()
    }
  }, [completedChapters.size, handleGenerateAll])

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
          <Progress
            value={progress}
            className={cn("w-full", {
              "bg-gray-200": !allChaptersCompleted,
              "bg-green-100": allChaptersCompleted,
            })}
            indicatorClassName={cn({
              "bg-green-600": allChaptersCompleted,
            })}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {completedChapters.size} of {totalChaptersCount} chapters completed
            </p>
            {allChaptersCompleted && (
              <span className="text-sm text-green-600 font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                All chapters completed
              </span>
            )}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-4 space-y-4">
            {course.units.map((unit, unitIndex) => (
              <Card key={String(unit.id)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Unit {unitIndex + 1}</span>
                    <span className="text-lg font-semibold mt-1">{unit.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Droppable droppableId={`unit-${String(unit.id)}`}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {unit.chapters.map((chapter, chapterIndex) => (
                          <Draggable key={String(chapter.id)} draggableId={String(chapter.id)} index={chapterIndex}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="relative">
                                <div className="flex items-start gap-2">
                                  <div {...provided.dragHandleProps} className="mt-3 cursor-grab">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    {editingChapterId === String(chapter.id) ? (
                                      <div className="flex items-center gap-2 mb-2">
                                        <Input
                                          value={editingChapterTitle}
                                          onChange={(e) => setEditingChapterTitle(e.target.value)}
                                          className="flex-1"
                                        />
                                        <Button size="sm" variant="outline" onClick={saveChapterTitle}>
                                          Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingChapterId(null)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium flex-1">{chapter.title}</h4>
                                        <Button size="sm" variant="ghost" onClick={() => startEditingChapter(chapter)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        {chapter.videoId && (
                                          <Button size="sm" variant="ghost" onClick={() => showVideo(chapter)}>
                                            <span className="sr-only">Preview Video</span>
                                            👁️
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                    <ChapterCard
                                      ref={chapterRefs.current[String(chapter.id)]}
                                      chapter={chapter}
                                      chapterIndex={chapterIndex}
                                      onChapterComplete={handleChapterComplete}
                                      isCompleted={completedChapters.has(String(chapter.id))}
                                      isGenerating={false}
                                      hideVideoControls={true} // Hide video controls in preview mode
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add new chapter section */}
                  {addingToUnitId === String(unit.id) ? (
                    <div className="mt-4 border rounded-md p-3 space-y-3">
                      <h4 className="font-medium">Add New Chapter</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Chapter title"
                          value={newChapter.title}
                          onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                        />
                        <Input
                          placeholder="YouTube Video ID (optional)"
                          value={newChapter.youtubeId}
                          onChange={(e) => setNewChapter({ ...newChapter, youtubeId: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a valid YouTube ID (11 characters) or leave blank to generate later
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setAddingToUnitId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={addNewChapter}>
                            Add Chapter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => startAddingChapter(String(unit.id))}
                      data-sidebar="add-chapter-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DragDropContext>
      </ScrollArea>
      <div className="flex-none p-4 border-t">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/explore">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          {allChaptersCompleted ? (
            <Button
              onClick={saveAndContinue}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-md"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Continue
                </span>
              )}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleGenerateAll}>
              Generate All
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentVideoTitle}</DialogTitle>
          </DialogHeader>
          <VideoPlayer videoId={currentVideoId} className="mt-2" />
        </DialogContent>
      </Dialog>

      {/* Debug Panel */}
      <DebugPanel
        editingChapterId={editingChapterId}
        showVideoDialog={showVideoDialog}
        currentVideoId={currentVideoId}
        addingToUnitId={addingToUnitId}
        completedChapters={completedChapters}
        totalChaptersCount={totalChaptersCount}
      />
    </div>
  )
}

export default ConfirmChapters
