"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle, PlayCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DragDropContext } from "react-beautiful-dnd"

import VideoPlayer from "../../course/[slug]/components/video/components/VideoPlayer"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GuidedHelp, GuidedHelpButton, useGuidedHelp } from "./GuidedHelp"
import { ContextualHelp } from "./ContextualHelp"
import { useEnhancedCourseEditor } from "../hooks/useEnhancedCourseEditor"
import EnhancedUnitCard from "./EnhancedUnitCard"
import { useToast } from "@/hooks"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-helper"
import { Chapter, Course, CourseUnit } from "@/app/types/types"
import VideoPreview from "./VideoPreview"

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
  } = courseEditor
  const { toast } = useToast()
  
  const { showHelp, openHelp, closeHelp, dismissPermanently } = useGuidedHelp()
  
  useEffect(() => {
    const allChapters = course.units.flatMap((unit) => unit.chapters)

    if (allChapters.length === 0) {
      toast({
        title: "Welcome to Course Creation",
        description:
          "To get started, add chapters to your course units. After adding chapters, you can generate videos for them.",
      })
    }

    if (completedChapters.size === 0) {
      const chaptersWithVideos = course.units.flatMap((unit) => unit.chapters.filter((chapter) => chapter.videoId))

      chaptersWithVideos.forEach((chapter) => {
        handleChapterComplete(String(chapter.id))
      })
    }
  }, [course.units, completedChapters.size, handleChapterComplete, toast])

  const chaptersWithErrors = Object.values(videoStatuses).filter((status) => status.status === "error").length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Guided Help Modal */}
      {showHelp && (
        <div className="items-center justify-center p-4">
          <GuidedHelp onClose={closeHelp} onDismissPermanently={dismissPermanently} />
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex-none p-4 lg:p-6 border-b-6 border-border bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-blue-500 border-3 border-border">
              <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground">
              {course.title}
            </h1>
          </div>
          <GuidedHelpButton onClick={openHelp} />
        </div>
        
        {/* Progress Section */}
        <div className="space-y-3">
          <Progress
            value={progress}
            className={cn(
              "w-full h-3 border-3 border-border rounded-none bg-muted",
              allChaptersCompleted && "border-green-500"
            )}
            indicatorClassName={cn(
              "rounded-none",
              allChaptersCompleted ? "bg-green-500" : "bg-blue-500"
            )}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm font-bold text-muted-foreground">
              {completedChapters.size} of {totalChaptersCount} chapters completed
            </p>
            {allChaptersCompleted && (
              <span className="text-sm text-green-500 font-black flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                All chapters completed
              </span>
            )}
          </div>
        </div>
        
        {/* Status Alerts */}
        {isGeneratingVideos && (
          <Alert className="mt-4 border-3 border-blue-500 bg-blue-500/10 rounded-none">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-none bg-blue-500 border-2 border-blue-500">
                <PlayCircle className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <AlertTitle className="font-black text-foreground">Generating Videos</AlertTitle>
                <AlertDescription className="text-sm space-y-2 mt-2">
                  <div className="font-medium">
                    Videos are being generated for your chapters. This may take a few minutes.
                    {queueStatus.pending > 0 &&
                      ` (${queueStatus.pending} videos in progress, ${queueStatus.size} in queue)`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    You can continue editing your course while videos are being generated. You'll be automatically
                    redirected when all videos are ready.
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
        
        {chaptersWithErrors > 0 && !isGeneratingVideos && (
          <Alert variant="destructive" className="mt-4 border-3 border-red-500 rounded-none bg-red-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <div className="flex-1">
                <AlertTitle className="font-black text-red-500">Video Generation Issues</AlertTitle>
                <AlertDescription className="space-y-3 mt-2 text-red-500">
                  <div className="text-sm font-medium">
                    {chaptersWithErrors} {chaptersWithErrors === 1 ? "chapter" : "chapters"} had errors during video
                    generation.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateAll(true)}
                      disabled={isSaving || isGeneratingVideos}
                      className="font-black border-2 border-border rounded-none hover:bg-yellow-500 hover:text-white"
                    >
                      Retry Failed Videos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateAll(false)}
                      disabled={isSaving || isGeneratingVideos}
                      className="font-black border-2 border-border rounded-none hover:bg-blue-500 hover:text-white"
                    >
                      Regenerate All Videos
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>
      
      {/* Content Area */}
      <ScrollArea className="flex-grow">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-4 lg:p-6 space-y-4">
            {course.units.flatMap((unit) => unit.chapters).length === 0 && (
              <Alert className="border-3 border-yellow-500 bg-yellow-500/10 rounded-none">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <AlertTitle className="font-black text-foreground">No Chapters Found</AlertTitle>
                    <AlertDescription className="text-sm mt-1 font-medium">
                      Start by adding chapters to your course units. Once you have chapters, you can generate videos for
                      them.
                    </AlertDescription>
                  </div>
                </div>
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
      
      {/* Footer Actions */}
      <div className="flex-none p-4 lg:p-6 border-t-6 border-border bg-card">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <Button 
            variant="outline" 
            asChild
            className="w-full lg:w-auto font-black border-3 border-border rounded-none shadow-neo hover:shadow-neo-hover"
          >
            <Link href="/dashboard/explore">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          
          <ContextualHelp
            title="Save Course"
            description="Save your course structure and optionally generate videos for all chapters. You can also save without videos and generate them later from the course page."
            side="top"
          >
            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:flex-initial">
              <Button
                onClick={saveAndContinue}
                disabled={isSaving || isGeneratingVideos}
                className={cn(
                  "flex-1 sm:flex-initial font-black border-3 border-border rounded-none shadow-neo hover:shadow-neo-hover transition-all",
                  allChaptersCompleted 
                    ? "bg-green-500 hover:bg-green-600 text-white" 
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                )}
              >
                {isSaving || isGeneratingVideos ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSaving ? "Saving..." : "Generating..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {allChaptersCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save & View Course
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save & Generate Videos
                      </>
                    )}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {!allChaptersCompleted && !isGeneratingVideos && (
                <Button
                  onClick={() => handleGenerateAll(false)}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1 sm:flex-initial font-black border-3 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded-none shadow-neo hover:shadow-neo-hover"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Generate All Videos
                </Button>
              )}

              {course.units.flatMap((unit) => unit.chapters).some((chapter) => !chapter.videoId) && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const updateData = courseEditor.prepareUpdateData()
                      const saveResponse = await api.post(`/course/update-chapters`, updateData)
                      if (!saveResponse.data.success) {
                        throw new Error(saveResponse.data.error || "Failed to save course structure")
                      }
                      toast({
                        title: "Course Saved",
                        description: "Course saved successfully. You can generate videos later from the course page.",
                      })
                      router.push(`/dashboard/course/${course.slug}`)
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to save course",
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={isSaving || isGeneratingVideos}
                  className="flex-1 sm:flex-initial font-black border-3 border-border rounded-none shadow-neo hover:shadow-neo-hover"
                >
                  Save Without Videos
                </Button>
              )}
            </div>
          </ContextualHelp>
        </div>
      </div>
      
      {/* Video Dialog - Proper working implementation with explicit background */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-3xl border-6 border-border rounded-none !bg-card p-0 shadow-neo">
          <DialogHeader className="p-6 pb-4 border-b-3 border-border !bg-muted">
            <DialogTitle className="font-black !text-foreground">{currentVideoTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-6 !bg-card">
            {currentVideoId && (
              <div className="aspect-video bg-[#000000] rounded-none overflow-hidden border-3 border-border">
                <VideoPreview videoId={currentVideoId} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedConfirmChapters