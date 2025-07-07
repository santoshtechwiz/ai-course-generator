"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle } from "lucide-react"
import { GlobalLoader } from "@/components/ui/loader"
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

interface ConfirmChaptersProps {
  course: Course & { units: CourseUnit[] }
}

export default function ConfirmChapters({ course }: ConfirmChaptersProps) {
  const {
    units,
    isLoading,
    isProcessing,
    completePercentage,
    isEditable,
    isComplete,
    hasVideoInProgress,
    chapters,
    handleDragEnd,
    handleUpdateChapters,
    handleReorderChapters,
    hasError,
    showHelp,
    error,
    openHelpDialog,
    closeHelpDialog,
    needsAuthentication,
    handleSignIn,
  } = useCourseEditor(course)

  useEffect(() => {
    // Focus the first chapter card when the page loads
    const timeoutId = setTimeout(() => {
      const firstChapter = document.querySelector('[data-chapter-card="0"]') as HTMLElement | null
      if (firstChapter) {
        firstChapter.focus()
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [])

  if (isLoading) return <GlobalLoader />

  return (
    <div className="flex flex-col h-full">
      <header className="mb-4 pb-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-primary" />
            {course.title}
          </h1>
          <p className="text-muted-foreground">Your course is being created. Please review the chapters.</p>
        </div>
        <GuidedHelpButton onClick={openHelpDialog} />
      </header>

      {hasError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Course Generation Progress</span>
          <span className="text-sm font-medium">{Math.round(completePercentage)}%</span>
        </div>
        <Progress value={completePercentage} className="h-2" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Course Chapters</h2>
        <div className="flex items-center">
          {isComplete ? (
            <span className="text-sm text-green-600 flex items-center mr-4">
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </span>
          ) : hasVideoInProgress ? (
            <span className="text-sm text-amber-600 flex items-center mr-4">
              <AlertCircle className="h-4 w-4 mr-1" />
              Videos generating
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-grow overflow-hidden flex flex-col">
        {units.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No units found. Please refresh or create a new course.</p>
          </div>
        ) : (
          <ScrollArea className="flex-grow pr-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {units.map((unit, unitIndex) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    unitIndex={unitIndex}
                    chapters={chapters.filter((c: Chapter) => c.unitId === unit.id)}
                  />
                ))}
              </div>
            </DragDropContext>
          </ScrollArea>
        )}
      </div>

      <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/course/create" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Create
          </Link>
        </Button>

        {needsAuthentication ? (
          <Button onClick={handleSignIn}>Sign In to Continue</Button>
        ) : (
          <div className="flex gap-2">
            {isComplete && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/course" className="flex items-center">
                  View All Courses
                </Link>
              </Button>
            )}
            <Button
              onClick={handleUpdateChapters}
              disabled={!isEditable || isProcessing}
              className={cn(isProcessing && "opacity-50 cursor-not-allowed")}
            >
              {isProcessing ? "Processing..." : isComplete ? "Update Course" : "Generate Videos"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <GuidedHelp 
        isOpen={showHelp} 
        onClose={closeHelpDialog}
        title="Course Chapter Management"
        steps={[
          {
            title: "Reorder Chapters",
            content: "You can drag and drop chapters to reorder them within their units."
          },
          {
            title: "Edit Content",
            content: "Click on any chapter to edit its title and content."
          },
          {
            title: "Generate Videos",
            content: "Once you're satisfied with your chapters, click 'Generate Videos' to create videos for each chapter."
          }
        ]}
      />

      <ContextualHelp position="right-center">
        <div className="p-4 bg-white rounded-lg shadow-lg max-w-md">
          <h3 className="font-medium text-lg mb-2">Course Chapters</h3>
          <p>
            Here you can review and organize your course chapters. Drag and drop to reorder them, and click
            on any chapter to edit its content. Once you're ready, generate videos for all chapters.
          </p>
        </div>
      </ContextualHelp>
    </div>
  )
}
