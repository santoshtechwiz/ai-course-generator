"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle, PlayCircle, Loader2 } from "lucide-react"
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
    prepareUpdateData,
    extractYoutubeIdFromUrl,
    generateVideoForChapter,
    cancelVideoProcessing,
  } = courseEditor
  const { toast } = useToast()
  
  // Local state for action loading
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionType, setActionType] = useState<'save' | 'generate' | 'skip' | null>(null)
  
  // Use the guided help hook
  const { showHelp, openHelp, closeHelp, dismissPermanently } = useGuidedHelp()
  
  // Initialize video processing on first load
  useEffect(() => {
    const allChapters = course.units.flatMap((unit) => unit.chapters)
    console.log(`🔍 Initial load found ${allChapters.length} chapters in ${course.units.length} units`)

    // Only show welcome message once on initial mount
    if (allChapters.length === 0 && completedChapters.size === 0) {
      const hasShownWelcome = sessionStorage.getItem('welcome-shown')
      if (!hasShownWelcome) {
        toast({
          title: "Welcome to Course Creation",
          description:
            "To get started, add chapters to your course units. After adding chapters, you can generate videos for them.",
        })
        sessionStorage.setItem('welcome-shown', 'true')
      }
    }

    // Initialize completed chapters with videos (only on first load)
    if (completedChapters.size === 0) {
      const chaptersWithVideos = course.units.flatMap((unit) => unit.chapters.filter((chapter) => chapter.videoId))
      chaptersWithVideos.forEach((chapter) => {
        handleChapterComplete(String(chapter.id))
      })
    }
  }, []) // Run only once on mount

  // Count chapters with errors
  const chaptersWithErrors = Object.values(videoStatuses).filter((status) => status.status === "error").length

  // Enhanced save and continue function
  const handleSaveAndContinue = async () => {
    // Prevent duplicate calls
    if (isActionLoading) return
    
    setIsActionLoading(true)
    setActionType('save')
    
    try {
      const allChapters = course.units.flatMap((unit) => unit.chapters)
      console.log(`📋 handleSaveAndContinue: Found ${allChapters.length} chapters`)

      // Save course structure first
      const updateData = prepareUpdateData()
      console.log("Sending update data to API:", JSON.stringify(updateData, null, 2))

      const saveResponse = await api.post(`/api/course/update-chapters`, updateData)
      
      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || "Failed to save course structure")
      }

      // Check if videos need to be generated
      const chaptersNeedingVideos = allChapters.filter((chapter) => !chapter.videoId)
      
      if (chaptersNeedingVideos.length > 0) {
        // Start video generation
        setActionType('generate')
        
        toast({
          title: "Starting Video Generation",
          description: `Generating videos for ${chaptersNeedingVideos.length} chapters...`,
        })

        // Wait for the video generation to complete
        const result = await handleGenerateAll()
        
        if (result) {
          toast({
            title: "Success!",
            description: "All videos generated. Redirecting...",
          })

          setTimeout(() => {
            router.push(`/dashboard/course/${course.slug}`)
          }, 1500)
        } else {
          // Some videos failed, but don't redirect
          toast({
            title: "Partial Success",
            description: "Some videos failed. You can retry from above.",
            variant: "destructive",
          })
        }
      } else {
        // All chapters have videos, redirect immediately
        toast({
          title: "Course Ready",
          description: "Redirecting to your course...",
        })

        setTimeout(() => {
          router.push(`/dashboard/course/${course.slug}`)
        }, 1000)
      }
    } catch (error) {
      console.error("Error in handleSaveAndContinue:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save course",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
      setActionType(null)
    }
  }

  // Handle skip videos action
  const handleSkipVideos = async () => {
    // Prevent duplicate calls
    if (isActionLoading) return
    
    setIsActionLoading(true)
    setActionType('skip')
    
    try {
      const updateData = prepareUpdateData()
      const saveResponse = await api.post(`/api/course/update-chapters`, updateData)
      
      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || "Failed to save course structure")
      }
      
      toast({
        title: "Course Saved",
        description: "Redirecting to course page...",
      })
      
      setTimeout(() => {
        router.push(`/dashboard/course/${course.slug}`)
      }, 800)
    } catch (error) {
      console.error("Error saving course:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save course",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
      setActionType(null)
    }
  }

  // Handle generate all videos action
  const handleGenerateAllVideos = async () => {
    // Prevent duplicate calls
    if (isActionLoading) return
    
    setIsActionLoading(true)
    setActionType('generate')
    
    try {
      const result = await handleGenerateAll(false)
      
      if (result) {
        toast({
          title: "Success",
          description: "All videos generated successfully!",
        })
      } else {
        toast({
          title: "Partial Success",
          description: "Some videos failed. Check errors above.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating videos:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate videos",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
      setActionType(null)
    }
  }

  // Determine if any action is in progress
  const isAnyActionLoading = isActionLoading || isSaving || isGeneratingVideos

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
        
        {/* Show queue status when videos are being generated */}
        {isGeneratingVideos && (
          <Alert className="mt-4 bg-blue-100 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
            <AlertTitle className="text-black font-bold">Generating Videos</AlertTitle>
            <AlertDescription className="text-gray-800">
              <div className="space-y-2">
                <div>
                  Videos are being generated for your chapters. This may take a few minutes.
                  {queueStatus.pending > 0 &&
                    ` (${queueStatus.pending} videos in progress, ${queueStatus.size} in queue)`}
                </div>
                <div className="text-sm">
                  You can continue editing your course while videos are being generated.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show retry options if some videos failed */}
        {chaptersWithErrors > 0 && !isGeneratingVideos && (
          <Alert className="mt-4 bg-red-100 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-black font-bold">Video Generation Issues</AlertTitle>
            <AlertDescription className="text-gray-800">
              <div className="space-y-3">
                <div>
                  {chaptersWithErrors} {chaptersWithErrors === 1 ? "chapter" : "chapters"} had errors during video
                  generation.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAll(true)}
                    disabled={isAnyActionLoading}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-yellow-400 hover:bg-yellow-500"
                  >
                    {isActionLoading && actionType === 'generate' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Retry Failed Videos'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAllVideos}
                    disabled={isAnyActionLoading}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-blue-400 hover:bg-blue-500"
                  >
                    {isActionLoading && actionType === 'generate' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate All Videos'
                    )}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <ScrollArea className="flex-grow">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="p-4 space-y-4">
            {course.units.flatMap((unit) => unit.chapters).length === 0 && (
              <Alert className="mb-4 bg-yellow-100 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-black font-bold">No Chapters Found</AlertTitle>
                <AlertDescription className="text-gray-800">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button 
            variant="outline" 
            asChild
            disabled={isAnyActionLoading}
            className="order-1 sm:order-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-white hover:bg-gray-100"
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-2 sm:order-none flex-1 sm:flex-initial sm:max-w-2xl">
              {/* Main action button */}
              <Button
                onClick={handleSaveAndContinue}
                disabled={isAnyActionLoading}
                className={cn(
                  "flex-1 transition-all duration-200 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] whitespace-nowrap font-bold",
                  allChaptersCompleted ? "bg-green-400 hover:bg-green-500" : "bg-blue-400 hover:bg-blue-500",
                )}
              >
                {isActionLoading && (actionType === 'save' || actionType === 'generate') ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {actionType === 'save' ? 'Saving...' : 'Generating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
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

              {/* Generate All Videos button */}
              {!allChaptersCompleted && !isGeneratingVideos && (
                <Button
                  onClick={handleGenerateAllVideos}
                  disabled={isAnyActionLoading}
                  variant="outline"
                  className="flex-1 sm:flex-initial whitespace-nowrap border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-purple-400 hover:bg-purple-500 font-bold"
                >
                  {isActionLoading && actionType === 'generate' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Generate All Videos
                    </>
                  )}
                </Button>
              )}

              {/* Skip videos option */}
              {course.units.flatMap((unit) => unit.chapters).some((chapter) => !chapter.videoId) && (
                <Button
                  variant="outline"
                  onClick={handleSkipVideos}
                  disabled={isAnyActionLoading}
                  className="flex-1 sm:flex-initial whitespace-nowrap border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-yellow-400 hover:bg-yellow-500 font-bold"
                >
                  {isActionLoading && actionType === 'skip' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Without Videos'
                  )}
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
          {currentVideoId && <VideoPreview videoId={currentVideoId} className="mt-2" />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedConfirmChapters