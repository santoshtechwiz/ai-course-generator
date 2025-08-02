"use client"

import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droppable, Draggable } from "react-beautiful-dnd"
import { GripVertical, Plus, Pencil, Eye, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Chapter, CourseUnit } from "@prisma/client"
import EnhancedChapterCard from "./EnhancedChapterCard"
import ChapterEditor from "./ChapterEditor"
import AddChapterForm from "./AddChapterForm"
import type { ChapterCardHandler } from "./EnhancedChapterCard"
import type { VideoStatus } from "../hooks/useVideoProcessing"

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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Unit {unitIndex + 1}</span>
            <span className="text-lg font-semibold mt-1">{unit.name}</span>
          </CardTitle>
        </CardHeader>        <CardContent className="space-y-2">
          <Droppable droppableId={`unit-${String(unit.id)}`} isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "space-y-2 p-2 rounded-md transition-colors",
                  snapshot.isDraggingOver ? "bg-primary/10 border-dashed border-2 border-primary/30" : "",
                )}
              >
                {unit.chapters.map((chapter, chapterIndex) => (
                  <Draggable key={String(chapter.id)} draggableId={String(chapter.id)} index={chapterIndex}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className="relative">
                        <div className="flex items-start gap-2">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-3 cursor-grab"
                            data-sidebar="chapter-drag-handle"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            {editingChapterId === String(chapter.id) ? (
                              <ChapterEditor
                                title={editingChapterTitle}
                                onTitleChange={onEditingChapterTitleChange}
                                onSave={onSaveChapterTitle}
                                onCancel={onCancelEditingChapter}
                              />
                            ) : (
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium flex-1" data-sidebar="chapter-title">
                                  {chapter.title}
                                </h4>
                                <Button size="sm" variant="ghost" onClick={() => onStartEditingChapter(chapter)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {chapter.videoId && (
                                  <Button size="sm" variant="ghost" onClick={() => onShowVideo(chapter)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                {videoStatuses[chapter.id]?.status === "processing" && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => onCancelProcessing(chapter.id)}
                                    className="text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
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
                              isFree={chapterIndex === 0} // First chapter in each unit is free
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
              className="mt-2 w-full"
              onClick={() => onStartAddingChapter(String(unit.id))}
              data-sidebar="add-chapter-button"
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

export default EnhancedUnitCard
