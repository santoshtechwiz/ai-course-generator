"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  Video, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks"
import { useVideoProcessing } from "@/app/dashboard/create/hooks/useVideoProcessing"
import type { FullCourseType, FullChapterType } from "@/app/types/types"

interface VideoGenerationSectionProps {
  course: FullCourseType
  isOwner:boolean
  isAdmin:boolean
  onVideoGenerated?: (chapterId: string, videoId: string) => void
}

export default function VideoGenerationSection({ course,isOwner,isAdmin, onVideoGenerated }: VideoGenerationSectionProps) {
 
  if(!isOwner || !isAdmin) return null;
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  // Get chapters that need videos
  const chaptersNeedingVideos = useMemo(() => {
    const chapters: any[] = [] // Use any[] to avoid type conflict
    if (course.courseUnits) {
      course.courseUnits.forEach(unit => {
        if (unit.chapters) {
          unit.chapters.forEach(chapter => {
            if (!chapter.videoId) {
              // Ensure description is properly handled
              const safeChapter = {
                ...chapter,
                description: chapter.description === null ? undefined : chapter.description
              }
              chapters.push(safeChapter)
            }
          })
        }
      })
    }
    return chapters
  }, [course.courseUnits])

  const totalChapters = useMemo(() => {
    return course.courseUnits?.reduce((acc, unit) => acc + (unit.chapters?.length || 0), 0) || 0
  }, [course.courseUnits])

  const chaptersWithVideos = totalChapters - chaptersNeedingVideos.length

  // Use the video processing hook
  const {
    processMultipleVideos,
    isProcessing,
    statuses,
    queueStatus,
  } = useVideoProcessing({
   
    onComplete: (status) => {
      console.log(`Video completed for chapter ${status.chapterId}:`, status)
      if (status.videoId && onVideoGenerated) {
        onVideoGenerated(String(status.chapterId), status.videoId)
      }
    },    onError: (status) => {
      // Keep only essential error logging
      console.error(`Video generation failed for chapter ${status.chapterId}:`, {
        error: status.message,
        status: status.status
      })

      toast({
        title: "Video Generation Failed",
        description: (
          <div className="flex flex-col gap-2">
            <p>{status.message || `Could not generate video for chapter ${status.chapterId}`}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Re-run video generation for this chapter
                processMultipleVideos([status.chapterId])
              }}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Retry Generation
            </Button>
          </div>
        ),
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to allow time to click retry
      })
    }
  })

  const handleGenerateVideos = useCallback(async () => {
    if (chaptersNeedingVideos.length === 0) {
      toast({
        title: "No videos to generate",
        description: "All chapters already have videos.",
      })
      return
    }

    setIsGenerating(true)
    try {
      const chapterIds = chaptersNeedingVideos.map(chapter => chapter.id)
      const result = await processMultipleVideos(chapterIds)
      
      toast({
        title: result.success ? "Success!" : "Partial Success",
        description: `Generated videos for ${result.processed} out of ${chaptersNeedingVideos.length} chapters`,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error generating videos:", error)
      toast({
        title: "Error",
        description: "Failed to start video generation process",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [chaptersNeedingVideos, processMultipleVideos, toast])

  // Don't show if all chapters have videos
  if (chaptersNeedingVideos.length === 0) {
    return null
  }

  const processingCount = Object.values(isProcessing).filter(Boolean).length
  const progressPercentage = totalChapters > 0 ? (chaptersWithVideos / totalChapters) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Generate Course Videos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {chaptersNeedingVideos.length} chapter{chaptersNeedingVideos.length !== 1 ? 's' : ''} need videos
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn(neo.badge, "bg-white/50")}>
              <Zap className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Video Generation Progress</span>
              <span>{chaptersWithVideos}/{totalChapters} complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Status Information */}
          {processingCount > 0 && (
            <Alert>
              <Loader2 className="h-4 w-4" />              <AlertDescription>
                Currently generating {processingCount} video{processingCount !== 1 ? 's' : ''}...
                <div className="mt-2 text-xs text-muted-foreground">
                  Queue status: {queueStatus.pending} pending, {queueStatus.size} in queue
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Chapters List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Chapters waiting for videos:</h4>
            <div className="grid gap-2 max-h-32 overflow-y-auto">
              {chaptersNeedingVideos.slice(0, 5).map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded border text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate flex items-center gap-2">
                      <span className="truncate">{chapter.title}</span>
                      {statuses[chapter.id]?.status && (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded-full",
                              statuses[chapter.id]?.status === 'completed' ? 'bg-green-600 text-white' :
                              statuses[chapter.id]?.status === 'processing' ? 'bg-blue-600 text-white' :
                              statuses[chapter.id]?.status === 'queued' ? 'bg-amber-500 text-black' :
                              statuses[chapter.id]?.status === 'error' ? 'bg-red-600 text-white' : 'bg-gray-200 text-black'
                            )}
                          >
                            {String(statuses[chapter.id]?.status).toUpperCase()}
                          </span>
                          {typeof statuses[chapter.id]?.progress === 'number' && (
                            <span className="text-xs text-muted-foreground">{Math.round(statuses[chapter.id]?.progress ?? 0)}%</span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Show queued job info if available */}
                    {statuses[chapter.id]?.status === 'queued' && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {statuses[chapter.id]?.jobId ? (
                          <>
                            Job <span className="font-mono">{String(statuses[chapter.id]?.jobId).slice(0,8)}</span>
                            {typeof statuses[chapter.id]?.queuePosition === 'number' && (
                              <> • position: {statuses[chapter.id]?.queuePosition}</>
                            )}
                          </>
                        ) : (
                          <>Queued</>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {isProcessing[chapter.id] ? (
                      <Loader2 className="h-3 w-3 text-orange-500" />
                    ) : statuses[chapter.id]?.status === "completed" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : statuses[chapter.id]?.status === "error" ? (
                      <XCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
              {chaptersNeedingVideos.length > 5 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  ... and {chaptersNeedingVideos.length - 5} more chapters
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleGenerateVideos}
              disabled={isGenerating || processingCount > 0}
              className="flex-1"
            >
              {isGenerating || processingCount > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2" />
                  Generating Videos...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate All Videos
                </>
              )}
            </Button>
            
            {(processingCount > 0 || Object.values(statuses).some(s => s.status === "error")) && (
              <Button variant="outline" size="sm" className="px-3">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground bg-white/40 dark:bg-gray-800/40 p-3 rounded border">
            <strong>Note:</strong> Video generation uses AI to create educational content for each chapter. 
            This process may take a few minutes per video. You can continue using the course while videos are being generated.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
