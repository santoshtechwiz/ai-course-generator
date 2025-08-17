"use client"

import React, { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { 
  markLectureCompleted, 
  setLastPosition, 
  setIsCourseCompleted
} from "@/store/slices/courseProgress-slice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  Play, 
  BookOpen, 
  Award,
  Loader2,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressTrackerProps {
  courseId: string | number
  currentChapterId?: string
  totalChapters: number
  completedChapters: string[]
  onProgressUpdate?: (progress: number) => void
  onChapterComplete?: (chapterId: string) => void
  onCourseComplete?: () => void
}

interface ProgressAction {
  type: 'chapter_complete' | 'position_update' | 'course_complete'
  chapterId?: string
  timestamp?: number
  status: 'pending' | 'success' | 'error'
  error?: string
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  courseId,
  currentChapterId,
  totalChapters,
  completedChapters,
  onProgressUpdate,
  onChapterComplete,
  onCourseComplete
}) => {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [pendingActions, setPendingActions] = useState<ProgressAction[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Get course progress from Redux
  const courseProgress = useAppSelector((state) => state.course.courseProgress[courseId])

  // Calculate progress percentage
  const progressPercentage = totalChapters > 0 ? (completedChapters.length / totalChapters) * 100 : 0
  const isCourseCompleted = progressPercentage >= 100

  // Add action to pending queue
  const addPendingAction = useCallback((action: Omit<ProgressAction, 'status'>) => {
    const newAction: ProgressAction = { ...action, status: 'pending' }
    setPendingActions(prev => [...prev, newAction])
    return newAction
  }, [])

  // Update action status
  const updateActionStatus = useCallback((actionIndex: number, status: 'success' | 'error', error?: string) => {
    setPendingActions(prev => prev.map((action, index) => 
      index === actionIndex ? { ...action, status, error } : action
    ))
  }, [])

  // Save progress with error handling and retry logic
  const saveProgress = useCallback(async (
    action: Omit<ProgressAction, 'status'>,
    retryCount = 0
  ): Promise<boolean> => {
    const maxRetries = 3
    const actionIndex = pendingActions.length
    addPendingAction(action)

    try {
      setIsSaving(true)

      switch (action.type) {
        case 'chapter_complete':
          if (action.chapterId) {
            dispatch(markLectureCompleted({ 
              courseId, 
              lectureId: action.chapterId 
            }))
            
            // Check if course is now completed
            const newCompletedCount = completedChapters.length + 1
            if (newCompletedCount >= totalChapters) {
              dispatch(setIsCourseCompleted({ courseId, isCourseCompleted: true }))
              onCourseComplete?.()
            }
            
            onChapterComplete?.(action.chapterId)
          }
          break

        case 'position_update':
          if (action.chapterId && action.timestamp !== undefined) {
            dispatch(setLastPosition({
              courseId,
              lectureId: action.chapterId,
              timestamp: action.timestamp
            }))
          }
          break

        case 'course_complete':
          dispatch(setIsCourseCompleted({ courseId, isCourseCompleted: true }))
          onCourseComplete?.()
          break
      }

      updateActionStatus(actionIndex, 'success')
      onProgressUpdate?.(progressPercentage)
      
      return true
    } catch (error) {
      console.error('Progress save error:', error)
      
      if (retryCount < maxRetries) {
        // Retry after exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => {
          saveProgress(action, retryCount + 1)
        }, delay)
        return false
      }

      updateActionStatus(actionIndex, 'error', error instanceof Error ? error.message : 'Unknown error')
      
      toast({
        title: "Progress Save Failed",
        description: "Your progress couldn't be saved. Don't worry, we'll retry automatically.",
        variant: "destructive",
      })
      
      return false
    } finally {
      setIsSaving(false)
    }
  }, [courseId, completedChapters.length, totalChapters, pendingActions.length, dispatch, toast, onProgressUpdate, onChapterComplete, onCourseComplete, addPendingAction, updateActionStatus])

  // Mark chapter as completed
  const markChapterComplete = useCallback(async (chapterId: string) => {
    if (completedChapters.includes(chapterId)) return // Already completed
    
    await saveProgress({
      type: 'chapter_complete',
      chapterId
    })
  }, [completedChapters, saveProgress])

  // Update video position
  const updateVideoPosition = useCallback(async (chapterId: string, timestamp: number) => {
    await saveProgress({
      type: 'position_update',
      chapterId,
      timestamp
    })
  }, [saveProgress])

  // Auto-save progress periodically
  useEffect(() => {
    if (!currentChapterId) return

    const interval = setInterval(() => {
      // Only save if we have a current position (this would come from video player)
      // For now, we'll just track the current chapter
      updateVideoPosition(currentChapterId, 0)
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [currentChapterId, updateVideoPosition])

  // Clean up completed actions
  useEffect(() => {
    const timer = setTimeout(() => {
      setPendingActions(prev => prev.filter(action => action.status === 'pending'))
    }, 5000) // Remove completed actions after 5 seconds

    return () => clearTimeout(timer)
  }, [pendingActions])

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            {isSaving && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Loader2 className="h-3 w-3 text-white animate-spin" />
              </motion.div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Course Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedChapters.length} of {totalChapters} chapters completed
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <Badge 
            variant={isCourseCompleted ? "default" : "secondary"}
            className={cn(
              "text-sm font-medium",
              isCourseCompleted && "bg-gradient-to-r from-green-500 to-emerald-600"
            )}
          >
            {isCourseCompleted ? (
              <>
                <Award className="h-3 w-3 mr-1" />
                Completed
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                {Math.round(progressPercentage)}%
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-3 bg-muted"
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            style={{ width: `${progressPercentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Action Status */}
      <AnimatePresence>
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {pendingActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-sm",
                  action.status === 'pending' && "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
                  action.status === 'success' && "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300",
                  action.status === 'error' && "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                )}
              >
                {action.status === 'pending' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {action.status === 'success' && (
                  <CheckCircle className="h-4 w-4" />
                )}
                {action.status === 'error' && (
                  <AlertCircle className="h-4 w-4" />
                )}
                
                <span className="flex-1">
                  {action.type === 'chapter_complete' && 'Saving chapter completion...'}
                  {action.type === 'position_update' && 'Saving progress...'}
                  {action.type === 'course_complete' && 'Marking course as complete...'}
                </span>
                
                {action.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveProgress(action)}
                    className="h-6 px-2 text-xs"
                  >
                    Retry
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      {currentChapterId && !completedChapters.includes(currentChapterId) && (
        <div className="flex gap-2">
          <Button
            onClick={() => markChapterComplete(currentChapterId)}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker