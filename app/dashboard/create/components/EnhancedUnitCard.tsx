/**
 * app/dashboard/create/components/EnhancedUnitCard.tsx
 * 
 * OPTIMIZED: Stable unit card with memoization
 * - Prevents unnecessary re-renders
 * - Stable callback references
 * - Efficient chapter rendering
 */

"use client"

import React, { memo, useCallback } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droppable, Draggable } from "react-beautiful-dnd"
import { GripVertical, Plus, Pencil, Eye, X } from "lucide-react"
import { cn } from "@/lib/utils"

import EnhancedChapterCard from "./EnhancedChapterCard"
import ChapterEditor from "./ChapterEditor"
import AddChapterForm from "./AddChapterForm"
import type { ChapterCardHandler } from "./EnhancedChapterCard"
import type { VideoStatus } from "../hooks/useVideoProcessing"
import { CourseUnit, Chapter } from "@/app/types/course-types"

interface EnhancedUnitCardProps {
  unit: CourseUnit & { chapters: Chapter[] }
  unitIndex: number
  chapterRefs: Record<string, React.RefObject<ChapterCardHandler>>
  editingChapterId: string | null
  editingChapterTitle: string
  addingToUnitId: string | null
  newChapter: { title: string; youtubeId: string }
  videoStatuses: Record<number, VideoStatus>
  isProcessing: Record<number, boolean>
  onStartEditingChapter: (chapter: Chapter) => void
  onSaveChapterTitle: () => void
  onCancelEditingChapter: () => void
  onEditingChapterTitleChange: (title: string) => void
  onShowVideo: (chapter: Chapter) => void
  onStartAddingChapter: (unitId: string) => void
  onNewChapterTitleChange: (title: string) => void
  onNewChapterYoutubeIdChange: (id: string) => void
  onAddNewChapter: () => void
  onCancelAddingChapter: () => void
  extractYoutubeIdFromUrl: (url: string) => string | null
  onGenerateVideo: (chapter: Chapter) => Promise<boolean>
  onCancelProcessing: (chapterId: number) => Promise<boolean>
  onRetryVideo: (chapterId: number) => Promise<void>
}

const EnhancedUnitCard = memo<EnhancedUnitCardProps>(
  ({
    unit,
    unitIndex,
    chapterRefs,
    editingChapterId,
    editingChapterTitle,
    addingToUnitId,
    newChapter,
    videoStatuses,
    isProcessing,
    onStartEditingChapter,
    onSaveChapterTitle,
    onCancelEditingChapter,
    onEditingChapterTitleChange,
    onShowVideo,
    onStartAddingChapter,
    onNewChapterTitleChange,
    onNewChapterYoutubeIdChange,
    onAddNewChapter,
    onCancelAddingChapter,
    extractYoutubeIdFromUrl,
    onGenerateVideo,
    onCancelProcessing,
    onRetryVideo,
  }) => {
    // Stable unit ID
    const unitId = String(unit.id)
    
    // Stable callbacks to prevent re-creating on every render
    const handleStartAddingChapter = useCallback(() => {
      onStartAddingChapter(unitId)
    }, [onStartAddingChapter, unitId])

    return (
      <Card className="border-4 border-border shadow-neo">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Unit {unitIndex + 1}
            </span>
            <span className="text-lg font-bold mt-1">{unit.title}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          <Droppable droppableId={`unit-${unitId}`} isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "space-y-3 p-3 rounded-none transition-all",
                  snapshot.isDraggingOver && "bg-primary/10 border-4 border-dashed border-primary"
                )}
              >
                {unit.chapters.map((chapter, chapterIndex) => (
                  <ChapterRow
                    key={String(chapter.id)}
                    chapter={chapter}
                    chapterIndex={chapterIndex}
                    chapterRef={chapterRefs[String(chapter.id)]}
                    editingChapterId={editingChapterId}
                    editingChapterTitle={editingChapterTitle}
                    videoStatus={videoStatuses[chapter.id]}
                    isProcessing={isProcessing[chapter.id] || false}
                    onStartEditingChapter={onStartEditingChapter}
                    onSaveChapterTitle={onSaveChapterTitle}
                    onCancelEditingChapter={onCancelEditingChapter}
                    onEditingChapterTitleChange={onEditingChapterTitleChange}
                    onShowVideo={onShowVideo}
                    onGenerateVideo={onGenerateVideo}
                    onCancelProcessing={onCancelProcessing}
                    onRetryVideo={onRetryVideo}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add new chapter section */}
          {addingToUnitId === unitId ? (
            <AddChapterForm
              title={newChapter.title}
              youtubeId={newChapter.youtubeId}
              onTitleChange={onNewChapterTitleChange}
              onYoutubeIdChange={onNewChapterYoutubeIdChange}
              onAdd={onAddNewChapter}
              onCancel={onCancelAddingChapter}
              extractYoutubeIdFromUrl={extractYoutubeIdFromUrl}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-2 border-dashed"
              onClick={handleStartAddingChapter}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter
            </Button>
          )}
        </CardContent>
      </Card>
    )
  },
)

EnhancedUnitCard.displayName = "EnhancedUnitCard"

// Separate ChapterRow component for better performance
interface ChapterRowProps {
  chapter: Chapter
  chapterIndex: number
  chapterRef?: React.RefObject<ChapterCardHandler>
  editingChapterId: string | null
  editingChapterTitle: string
  videoStatus?: VideoStatus
  isProcessing: boolean
  onStartEditingChapter: (chapter: Chapter) => void
  onSaveChapterTitle: () => void
  onCancelEditingChapter: () => void
  onEditingChapterTitleChange: (title: string) => void
  onShowVideo: (chapter: Chapter) => void
  onGenerateVideo: (chapter: Chapter) => Promise<boolean>
  onCancelProcessing: (chapterId: number) => Promise<boolean>
  onRetryVideo: (chapterId: number) => Promise<void>
}

const ChapterRow = memo<ChapterRowProps>(({
  chapter,
  chapterIndex,
  chapterRef,
  editingChapterId,
  editingChapterTitle,
  videoStatus,
  isProcessing,
  onStartEditingChapter,
  onSaveChapterTitle,
  onCancelEditingChapter,
  onEditingChapterTitleChange,
  onShowVideo,
  onGenerateVideo,
  onCancelProcessing,
  onRetryVideo,
}) => {
  const chapterId = String(chapter.id)
  
  // Stable callbacks
  const handleStartEditing = useCallback(() => {
    onStartEditingChapter(chapter)
  }, [onStartEditingChapter, chapter])
  
  const handleShowVideo = useCallback(() => {
    onShowVideo(chapter)
  }, [onShowVideo, chapter])
  
  const handleGenerateVideo = useCallback(() => {
    return onGenerateVideo(chapter)
  }, [onGenerateVideo, chapter])
  
  const handleCancelProcessing = useCallback(() => {
    return onCancelProcessing(chapter.id)
  }, [onCancelProcessing, chapter.id])
  
  const handleRetryVideo = useCallback(() => {
    return onRetryVideo(chapter.id)
  }, [onRetryVideo, chapter.id])

  return (
    <Draggable draggableId={chapterId} index={chapterIndex}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef} 
          {...provided.draggableProps} 
          className={cn(
            "relative transition-all",
            snapshot.isDragging && "shadow-neo scale-105"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              {...provided.dragHandleProps}
              className="mt-4 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-2">
              {editingChapterId === chapterId ? (
                <ChapterEditor
                  title={editingChapterTitle}
                  onTitleChange={onEditingChapterTitleChange}
                  onSave={onSaveChapterTitle}
                  onCancel={onCancelEditingChapter}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-none bg-muted/30 border-2 border-border">
                  <h4 className="font-semibold text-sm flex-1">{chapter.title}</h4>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleStartEditing}
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    
                    {chapter.videoId && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleShowVideo}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {isProcessing && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleCancelProcessing}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <EnhancedChapterCard
                ref={chapterRef}
                chapter={chapter}
                chapterIndex={chapterIndex}
                videoStatus={videoStatus}
                isProcessing={isProcessing}
                onGenerateVideo={handleGenerateVideo}
                onCancelProcessing={handleCancelProcessing}
                onRetryVideo={handleRetryVideo}
                isFree={chapterIndex === 0}
              />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}, (prev, next) => {
  // Custom comparison for optimal re-rendering
  return (
    prev.chapter.id === next.chapter.id &&
    prev.chapter.title === next.chapter.title &&
    prev.chapter.videoId === next.chapter.videoId &&
    prev.editingChapterId === next.editingChapterId &&
    prev.editingChapterTitle === next.editingChapterTitle &&
    prev.videoStatus?.status === next.videoStatus?.status &&
    prev.videoStatus?.progress === next.videoStatus?.progress &&
    prev.isProcessing === next.isProcessing
  )
})

ChapterRow.displayName = "ChapterRow"

export default EnhancedUnitCard