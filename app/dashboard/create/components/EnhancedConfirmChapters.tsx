"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DragDropContext } from "react-beautiful-dnd"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import VideoPlayer from "./VideoPlayer"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GuidedHelp, GuidedHelpButton, useGuidedHelp } from "./GuidedHelp"
import { ContextualHelp } from "./ContextualHelp"
import { useEnhancedCourseEditor } from "../hooks/useEnhancedCourseEditor"
import EnhancedUnitCard from "./EnhancedUnitCard"
import { useToast } from "@/hooks"
import { useRouter } from "next/navigation"
import axios from "axios"

export type CourseProps = {
  course: Course & {
    units: (CourseUnit & {
      chapters: Chapter[]
    })[]
  }
}

const EnhancedConfirmChapters = ({ course: initialCourse }: CourseProps) => {
  const router = useRouter()
  const courseEditor = useEnhancedCourseEditor(initialCourse)
  const {
    course,
    completedChapters,
    editingChapterId,
    editingChapterTitle,
    showVideoDialog,
    setShowVideoDialog,
    currentVideoId,
    currentVideoTitle,
    newChapter,
    setNewChapter,
    addingToUnitId,
    isSaving,
    isGeneratingVideos,
    chapterRefs,
    videoStatuses,
    queueStatus,
    totalChaptersCount,
    progress,
    allChaptersCompleted,
    handleChapterComplete,
    handleGenerateAll,
    startEditingChapter,
    saveChapterTitle,
    cancelEditingChapter,
    setEditingChapterTitle,
    showVideo,
    startAddingChapter,
    addNewChapter,
    cancelAddingChapter,
    handleDragEnd,
    saveAndContinue,
    extractYoutubeIdFromUrl,
    generateVideoForChapter,
    cancelVideoProcessing,
  } = courseEditor
  const { toast } = useToast()
  // Use the guided help hook
  const { showHelp, openHelp, closeHelp, dismissPermanently } = useGuidedHelp()
  // Initialize video processing on first load
  useEffect(() => {
    // Check if there are any chapters
    const allChapters = course.units.flatMap((unit) => unit.chapters)
    console.log(`🔍 Initial load found ${allChapters.length} chapters in ${course.units.length} units`)

    // Show a helpful message if there are no chapters
    if (allChapters.length === 0) {
      toast({
        title: "Welcome to Course Creation",
        description:
          "To get started, add chapters to your course units. After adding chapters, you can generate videos for them.",
      })
    }

    // Only mark chapters that already have videos as completed - don't auto-generate
    if (completedChapters.size === 0) {
      const chaptersWithVideos = course.units.flatMap((unit) => unit.chapters.filter((chapter) => chapter.videoId))

      chaptersWithVideos.forEach((chapter) => {
        handleChapterComplete(String(chapter.id))
      })
    }
  }, [course.units, completedChapters.size, handleChapterComplete, toast])

  // Count chapters with errors
  const chaptersWithErrors = Object.values(videoStatuses).filter((status) => status.status === "error").length

  return (
    <div className="flex flex-col h-full">
      {/* Guided Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <GuidedHelp onClose={closeHelp} onDismissPermanently={dismissPermanently} />
        </div>
      )}
      <div className="flex-none p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {course.title}
          </h1>
          <GuidedHelpButton onClick={openHelp} />
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
        </div>{" "}
        {/* Show queue status when videos are being generated */}
        {isGeneratingVideos && (
          <Alert className="mt-4 bg-primary/10 border-primary/20">
            <div className="animate-spin h-4 w-4 text-primary mr-2" />
            <AlertTitle>Generating Videos</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  Videos are being generated for your chapters. This may take a few minutes.
                  {queueStatus.pending > 0 &&
                    ` (${queueStatus.pending} videos in progress, ${queueStatus.size} in queue)`}
                </div>
                <div className="text-sm text-muted-foreground">
                  You can continue editing your course while videos are being generated. You'll be automatically
                  redirected when all videos are ready.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {/* Show retry options if some videos failed */}
        {chaptersWithErrors > 0 && !isGeneratingVideos && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Video Generation Issues</AlertTitle>
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  {chaptersWithErrors} {chaptersWithErrors === 1 ? "chapter" : "chapters"} had errors during video
                  generation.
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAll(true)} // retry failed only
                    disabled={isSaving || isGeneratingVideos}
                  >
                    Retry Failed Videos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAll(false)} // regenerate all
                    disabled={isSaving || isGeneratingVideos}
                  >
                    Regenerate All Videos
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>{" "}
      <ScrollArea className="flex-grow">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-4 space-y-4">
            {/* Display a helpful message if there are no chapters */}
            {course.units.flatMap((unit) => unit.chapters).length === 0 && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Chapters Found</AlertTitle>
                <AlertDescription>
                  Start by adding chapters to your course units. Once you have chapters, you can generate videos for
                  them.
                </AlertDescription>
              </Alert>
            )}

            {course.units.map((unit, unitIndex) => (
              <ContextualHelp
                key={String(unit.id)}
                title="Unit Management"
                description="You can reorder chapters by dragging them using the handle on the left. Add custom chapters with the 'Add Chapter' button."
                side="right"
              >
                <EnhancedUnitCard
                  unit={unit}
                  unitIndex={unitIndex}
                  chapterRefs={chapterRefs.current}
                  completedChapters={completedChapters}
                  editingChapterId={editingChapterId}
                  editingChapterTitle={editingChapterTitle}
                  addingToUnitId={addingToUnitId}
                  newChapter={newChapter}
                  isGeneratingVideos={isGeneratingVideos}
                  videoStatuses={videoStatuses}
                  onChapterComplete={handleChapterComplete}
                  onStartEditingChapter={startEditingChapter}
                  onSaveChapterTitle={saveChapterTitle}
                  onCancelEditingChapter={cancelEditingChapter}
                  onEditingChapterTitleChange={setEditingChapterTitle}
                  onShowVideo={showVideo}
                  onStartAddingChapter={startAddingChapter}
                  onNewChapterTitleChange={(title) => setNewChapter({ ...newChapter, title })}
                  onNewChapterYoutubeIdChange={(id) => setNewChapter({ ...newChapter, youtubeId: id })}
                  onAddNewChapter={addNewChapter}
                  onCancelAddingChapter={cancelAddingChapter}
                  extractYoutubeIdFromUrl={extractYoutubeIdFromUrl}
                  onGenerateVideo={generateVideoForChapter}
                  onCancelProcessing={cancelVideoProcessing}
                />
              </ContextualHelp>
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
          </Button>{" "}
          <ContextualHelp
            title="Save Course"
            description="Save your course structure and optionally generate videos for all chapters. You can also save without videos and generate them later from the course page."
            side="top"
          >
            <div className="flex gap-3">
              <Button
                onClick={saveAndContinue}
                disabled={isSaving || isGeneratingVideos}
                className={cn(
                  "flex-1 transition-all duration-300 shadow-md",
                  allChaptersCompleted ? "bg-green-600 hover:bg-green-700" : "",
                )}
              >
                {isSaving || isGeneratingVideos ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 text-primary mr-2" />
                    {isSaving ? "Saving..." : "Generating Videos..."}
                  </span>
                ) : (
                  <span className="flex items-center">
                    {allChaptersCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save & View Course
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Save & Generate Videos
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>

              {/* Add explicit "Generate All Videos" button */}
              {!allChaptersCompleted && !isGeneratingVideos && (
                <Button
                  onClick={() => handleGenerateAll(false)}
                  disabled={isSaving}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Generate All Videos
                </Button>
              )}

              {/* Skip videos option - only show if there are chapters without videos */}
              {course.units.flatMap((unit) => unit.chapters).some((chapter) => !chapter.videoId) && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Save course without generating videos, then redirect
                    try {
                      const updateData = courseEditor.prepareUpdateData()
                      const saveResponse = await axios.post(`/api/course/update-chapters`, updateData)
                      if (!saveResponse.data.success) {
                        throw new Error(saveResponse.data.error || "Failed to save course structure")
                      }
                      toast({
                        title: "Course Saved",
                        description: "Course saved successfully. You can generate videos later from the course page.",
                      })
                      router.push(`/dashboard/course/${course.slug}`)
                    } catch (error) {
                      console.error("Error saving course:", error)
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to save course",
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={isSaving || isGeneratingVideos}
                  className="whitespace-nowrap"
                >
                  Save Without Videos
                </Button>
              )}
            </div>
          </ContextualHelp>
        </div>
      </div>
      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-3xl">
          {" "}
          <DialogHeader>
            <DialogTitle>{currentVideoTitle}</DialogTitle>
          </DialogHeader>
          {currentVideoId && <VideoPlayer videoId={currentVideoId} className="mt-2" />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedConfirmChapters
