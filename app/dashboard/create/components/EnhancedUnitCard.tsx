"use client"

import React from "react"
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
  completedChapters: Set<string>
  editingChapterId: string | null
  editingChapterTitle: string
  addingToUnitId: string | null
  newChapter: { title: string; youtubeId: string }
  isGeneratingVideos: boolean
  videoStatuses: Record<number, VideoStatus>
  onChapterComplete: (chapterId: string) => void
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
}

const EnhancedUnitCard = React.memo<EnhancedUnitCardProps>(
  ({
    unit,
    unitIndex,
    chapterRefs,
    completedChapters,
    editingChapterId,
    editingChapterTitle,
    addingToUnitId,
    newChapter,
    isGeneratingVideos,
    videoStatuses,
    onChapterComplete,
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
  }) => {
    return (
      <Card className="border-3 border-border shadow-neo rounded-none bg-card">
        <CardHeader className="pb-4 border-b-3 border-border bg-muted/30">
          <CardTitle className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-primary text-background text-sm font-black border-2 border-border">
                {unitIndex + 1}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Unit {unitIndex + 1}
              </span>
            </div>
            <span className="text-lg font-black text-foreground">{unit.name}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 p-4">
          <Droppable droppableId={`unit-${String(unit.id)}`} isDropDisabled={false} isCombineEnabled={false}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "space-y-3 p-3 rounded-none transition-all min-h-[100px]",
                  snapshot.isDraggingOver 
                    ? "bg-primary/10 border-3 border-dashed border-primary" 
                    : "bg-transparent",
                )}
              >
                {unit.chapters.map((chapter, chapterIndex) => (
                  <Draggable key={String(chapter.id)} draggableId={String(chapter.id)} index={chapterIndex}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        className={cn(
                          "relative transition-all",
                          snapshot.isDragging && "opacity-50 rotate-2 scale-105"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="mt-3 cursor-grab active:cursor-grabbing p-2 rounded-none border-2 border-border bg-muted hover:bg-primary hover:border-primary hover:text-background transition-all"
                            data-sidebar="chapter-drag-handle"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {editingChapterId === String(chapter.id) ? (
                              <ChapterEditor
                                title={editingChapterTitle}
                                onTitleChange={onEditingChapterTitleChange}
                                onSave={onSaveChapterTitle}
                                onCancel={onCancelEditingChapter}
                              />
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 p-2 bg-muted/30 rounded-none border-2 border-border">
                                <h4 className="font-black flex-1 text-foreground truncate" data-sidebar="chapter-title">
                                  {chapter.title}
                                </h4>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => onStartEditingChapter(chapter)}
                                    className="h-8 w-8 p-0 border-2 border-transparent hover:border-primary hover:bg-primary/10"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  {chapter.videoId && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => onShowVideo(chapter)}
                                      className="h-8 w-8 p-0 border-2 border-transparent hover:border-success hover:bg-success/10"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {videoStatuses[chapter.id]?.status === "processing" && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => onCancelProcessing(chapter.id)}
                                      className="h-8 w-8 p-0 border-2 border-transparent hover:border-danger hover:bg-danger/10 text-danger"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                            <EnhancedChapterCard
                              ref={chapterRefs[String(chapter.id)]}
                              chapter={chapter}
                              chapterIndex={chapterIndex}
                              onChapterComplete={onChapterComplete}
                              isCompleted={completedChapters.has(String(chapter.id))}
                              isGeneratingVideos={isGeneratingVideos}
                              hideVideoControls={false}
                              onGenerateVideo={onGenerateVideo}
                              isFree={chapterIndex === 0}
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
              className="mt-3 w-full h-11 font-black border-3 border-dashed border-primary text-primary hover:bg-primary hover:text-background hover:border-solid rounded-none shadow-neo hover:shadow-neo-hover transition-all"
              onClick={() => onStartAddingChapter(String(unit.id))}
              data-sidebar="add-chapter-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter to this Unit
            </Button>
          )}
        </CardContent>
      </Card>
    )
  },
)

EnhancedUnitCard.displayName = "EnhancedUnitCard"

export default EnhancedUnitCard