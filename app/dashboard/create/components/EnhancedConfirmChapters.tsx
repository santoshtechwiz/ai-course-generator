/**
 * app/dashboard/create/components/EnhancedConfirmChapters.tsx
 * 
 * UX FIXED: Responsive footer with Neobrutal theme colors
 * - Mobile-first responsive design
 * - Bold Neobrutal button styling
 * - Clear visual hierarchy
 */

"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle, PlayCircle, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DragDropContext } from "react-beautiful-dnd"

import VideoPlayer from "../../course/[slug]/components/video/components/VideoPlayer"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GuidedHelp, GuidedHelpButton, useGuidedHelp } from "./GuidedHelp"

import EnhancedUnitCard from "./EnhancedUnitCard"
import { useToast } from "@/hooks"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-helper"
import { Chapter, Course, CourseUnit } from "@/app/types/types"
import { useEnhancedCourseEditor } from "../hooks/useCourseEditor"
import VideoPreview from "./VideoPreview"
import ChapterFooter from "./ChapterFooter"

type CourseProps = {
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
    retryVideoProcessing,
    isProcessing,
  } = courseEditor

  const { toast } = useToast()
  const { showHelp, openHelp, closeHelp, dismissPermanently } = useGuidedHelp()

  // Initialize on mount - run once
  useEffect(() => {
    const allChapters = course.units.flatMap((unit) => unit.chapters)

    if (allChapters.length === 0) {
      toast({
        title: "Welcome to Course Creation",
        description: "Add chapters to your course units to get started.",
      })
    }
  }, [])

  // Memoize error count to prevent recalculation
  const chaptersWithErrors = useMemo(() => {
    return Object.values(videoStatuses).filter((status) => status.status === "error").length
  }, [videoStatuses])

  // Memoize processing count
  const processingCount = useMemo(() => {
    return Object.values(isProcessing).filter(Boolean).length
  }, [isProcessing])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Guided Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <GuidedHelp onClose={closeHelp} onDismissPermanently={dismissPermanently} />
        </div>
      )}

      {/* Header Section */}
      <div className="flex-none p-4 md:p-6 border-b-4 border-border bg-card shadow-neo">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-none bg-primary/10 border-2 border-primary/20">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <span className="line-clamp-1">{course.title}</span>
          </h1>
          <GuidedHelpButton onClick={openHelp} />
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Course Progress</span>
            <span className="text-muted-foreground">
              {completedChapters.size} / {totalChaptersCount} chapters
            </span>
          </div>

          <Progress
            value={progress}
            className={cn(
              "w-full h-3 border-2 border-border transition-all duration-500",
              allChaptersCompleted && "bg-success/20"
            )}
            indicatorClassName={cn(
              "transition-all duration-500 ease-out",
              allChaptersCompleted ? "bg-success" : "bg-primary"
            )}
          />

          {allChaptersCompleted && (
            <div className="flex items-center gap-2 text-success font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>All chapters completed!</span>
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {isGeneratingVideos && (
          <Alert className="mt-4 border-2 border-primary bg-primary/5">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <AlertTitle>Generating Videos</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>Processing {processingCount} {processingCount === 1 ? 'video' : 'videos'}. This may take a few minutes.</p>
                <p className="text-xs text-muted-foreground">
                  You can continue editing while videos generate. Progress is saved automatically.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {chaptersWithErrors > 0 && !isGeneratingVideos && (
          <Alert variant="destructive" className="mt-4 border-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Video Generation Issues</AlertTitle>
            <AlertDescription>
              <div className="space-y-3">
                <p>
                  {chaptersWithErrors} {chaptersWithErrors === 1 ? "chapter" : "chapters"} failed to generate videos.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAll(true)}
                    disabled={isSaving || isGeneratingVideos}
                    className="border-2 w-full sm:w-auto"
                  >
                    Retry Failed Videos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAll(false)}
                    disabled={isSaving || isGeneratingVideos}
                    className="border-2 w-full sm:w-auto"
                  >
                    Regenerate All
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content Section */}
      <ScrollArea className="flex-grow">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-4 md:p-6 space-y-6">
            {course.units.flatMap((unit) => unit.chapters).length === 0 && (
              <Alert className="border-2 border-warning bg-warning/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Chapters Found</AlertTitle>
                <AlertDescription>
                  Start by adding chapters to your course units. Use the "Add Chapter" button below each unit.
                </AlertDescription>
              </Alert>
            )}

            {course.units.map((unit, unitIndex) => (
              <EnhancedUnitCard
                key={String(unit.id)}
                unit={unit}
                unitIndex={unitIndex}
                chapterRefs={chapterRefs.current}
                editingChapterId={editingChapterId}
                editingChapterTitle={editingChapterTitle}
                addingToUnitId={addingToUnitId}
                newChapter={newChapter}
                videoStatuses={videoStatuses}
                isProcessing={isProcessing}
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
                onRetryVideo={retryVideoProcessing}
              />
            ))}
          </div>
        </DragDropContext>
      </ScrollArea>

      {/* Footer Actions - NEOBRUTAL STYLED */}
      <ChapterFooter router={router} courseEditor={courseEditor} course={course} isSaving={isSaving} isGeneratingVideos={isGeneratingVideos} totalChaptersCount={totalChaptersCount} allChaptersCompleted={allChaptersCompleted} handleGenerateAll={handleGenerateAll} saveAndContinue={saveAndContinue} toast={toast}></ChapterFooter>


      {/* Video Preview Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-3xl border-4 border-border shadow-neo">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{currentVideoTitle}</DialogTitle>
          </DialogHeader>
          {currentVideoId && <VideoPreview videoId={currentVideoId}  />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedConfirmChapters