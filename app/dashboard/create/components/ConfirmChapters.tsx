"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle, PlayCircle } from "lucide-react"
import { GlobalLoader, useGlobalLoader } from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DragDropContext } from "react-beautiful-dnd"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import VideoPlayer from "./VideoPlayer"
import { cn } from "@/lib/tailwindUtils"
import UnitCard from "./UnitCard"
import { useCourseEditor } from "../hooks/useCourseEditor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GuidedHelp, GuidedHelpButton, useGuidedHelp } from "./GuidedHelp"
import { ContextualHelp } from "./ContextualHelp"

export type CourseProps = {
  course: Course & {
    units: (CourseUnit & {
      chapters: Chapter[]
    })[]
  }
}

const ConfirmChapters = ({ course: initialCourse }: CourseProps) => {
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
    generationStatuses,
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
  } = useCourseEditor(initialCourse)

  // Use the guided help hook
  const { showHelp, openHelp, closeHelp, dismissPermanently } = useGuidedHelp()

  // Remove or comment out this useEffect that auto-generates videos
  // useEffect(() => {
  //   if (completedChapters.size === 0) {
  //     handleGenerateAll()
  //   }
  // }, [completedChapters.size, handleGenerateAll])

  // Replace with this useEffect that only marks existing videos as completed
  useEffect(() => {
    if (completedChapters.size === 0) {
      // Only mark chapters that already have videos as completed
      const chaptersWithVideos = course.units.flatMap((unit) => unit.chapters.filter((chapter) => chapter.videoId))

      chaptersWithVideos.forEach((chapter) => {
        handleChapterComplete(String(chapter.id))
      })
    }
  }, [completedChapters.size, handleChapterComplete, course.units])

  // Count chapters with errors
  const chaptersWithErrors = Object.values(generationStatuses).filter((status) => status.status === "error").length

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
        </div>

        {/* Show alert if there are chapters with errors */}
        {chaptersWithErrors > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Video Generation Issues</AlertTitle>
            <AlertDescription>
              {chaptersWithErrors} {chaptersWithErrors === 1 ? "chapter" : "chapters"} had errors during video
              generation. You can retry generating videos for these chapters individually.
            </AlertDescription>
          </Alert>
        )}

        {/* Show alert when videos are being generated */}
        {isGeneratingVideos && (
          <Alert className="mt-4 bg-primary/10 border-primary/20">
            <GlobalLoader size="xs" className="text-primary" />
            <AlertTitle>Generating Videos</AlertTitle>
            <AlertDescription>
              Videos are being generated for your chapters. This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}
      </div>{" "}
      <ScrollArea className="flex-grow">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-4 space-y-4">
            {course.units.map((unit, unitIndex) => (
              <ContextualHelp
                key={String(unit.id)}
                title="Unit Management"
                description="You can reorder chapters by dragging them using the handle on the left. Add custom chapters with the 'Add Chapter' button."
                side="right"
              >
                <UnitCard
                  unit={unit}
                  unitIndex={unitIndex}
                  chapterRefs={chapterRefs.current}
                  completedChapters={completedChapters}
                  editingChapterId={editingChapterId}
                  editingChapterTitle={editingChapterTitle}
                  addingToUnitId={addingToUnitId}
                  newChapter={newChapter}
                  isGeneratingVideos={isGeneratingVideos}
                  generationStatuses={generationStatuses}
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
          </Button>
          <ContextualHelp
            title="Save and Continue"
            description="This will save your course structure. You can choose to generate videos now or save without videos and generate them later."
            side="top"
          >
            <div className="flex gap-3">
              <Button
                onClick={saveAndContinue}
                disabled={isSaving || isGeneratingVideos}
                className={cn(
                  "transition-all duration-300 shadow-md",
                  allChaptersCompleted ? "bg-green-600 hover:bg-green-700" : "",
                )}
              >
                {isSaving || isGeneratingVideos ? (
                  <span className="flex items-center">
                    <GlobalLoader className="w-4 h-4 mr-2" />
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
                      <>Save & Generate Videos</>
                    )}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>

              {/* Add explicit "Generate All Videos" button when there are chapters without videos */}
              {!allChaptersCompleted && !isGeneratingVideos && (
                <Button
                  onClick={() => handleGenerateAll()}
                  disabled={isSaving}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Generate All Videos
                </Button>
              )}
            </div>
          </ContextualHelp>
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
    </div>
  )
}

export default ConfirmChapters
