"use client"

import Link from "next/link"
import { Button } from "@/components/ui"
import { api } from "@/lib/api-helper"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  PlayCircle,
  Save,
  Loader2,
  CheckCircle,
  BookOpen,
  ChevronRight,
} from "lucide-react"
import type { Router } from "next/router"
import React from "react"

type ChapterFooterProps = {
  allChaptersCompleted: boolean
  isGeneratingVideos: boolean
  isSaving: boolean
  totalChaptersCount: number
  course: { slug: string }
  courseEditor: { prepareUpdateData: () => any }
  toast: (opts: { title: string; description?: string; variant?: string }) => void
  router: Router
  handleGenerateAll: (force: boolean) => void
  saveAndContinue: () => void
}

/**
 * Neo-Brutal Chapter Footer
 * - Keeps all existing logic and handlers
 * - Only visual/layout changes for Neo-Brutal theme and responsiveness
 */
function ChapterFooter(props: ChapterFooterProps) {
  return (
    <div
      className={cn(
        "w-full flex",
        // core neo-brutal surface
        "bg-[color:var(--nb-bg)] text-[color:var(--nb-fg)]",
        // border & inset
        "border-t-[6px] border-[color:var(--nb-border)]",
        // inner padding responsive - reduced for smaller footer
        "p-3 md:p-4",
        // keep stacking context strong to avoid overlap
        "z-10"
      )}
    >
      {/* Container: mobile stacked; desktop flex layout */}
      <div className="max-w-[1200px] mx-auto">
        {/* Mobile layout */}
        <div className="md:hidden flex flex-col gap-3">
          {/* Back */}
          <Button
            variant="outline"
            asChild
            className={cn(
              "w-full h-10 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)]",
              // neo-brutal white inset
              "bg-[color:var(--nb-btn-bg)] text-[color:var(--nb-btn-fg)]",
              "font-black text-sm",
              "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all duration-150"
            )}
          >
            <Link href="/dashboard/explore" className="flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 mr-2" />
              BACK TO EXPLORE
            </Link>
          </Button>

          {/* Generate All (conditional) */}
          {!props.allChaptersCompleted && !props.isGeneratingVideos && props.totalChaptersCount > 0 && (
            <Button
              onClick={() => props.handleGenerateAll(false)}
              disabled={props.isSaving}
              className={cn(
                "w-full h-10 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] font-black text-sm",
                "bg-[color:var(--nb-accent)] text-[color:var(--nb-accent-fg)]",
                "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-center">
                <PlayCircle className="w-5 h-5 mr-2" />
                GENERATE ALL VIDEOS
              </div>
            </Button>
          )}

          {/* Save Without Videos */}
          {props.totalChaptersCount > 0 && (
            <Button
              onClick={async () => {
                try {
                  const updateData = props.courseEditor.prepareUpdateData()
                  const saveResponse = await api.post(`/api/course/update-chapters`, updateData)
                  const saveSuccess = saveResponse?.data?.success

                  if (!saveSuccess) {
                    throw new Error(saveResponse?.data?.error || "Failed to save")
                  }

                  props.toast({
                    title: "Saved",
                    description: "Course saved. You can generate videos later.",
                  })
                  props.router.push(`/dashboard/course/${props.course.slug}`)
                } catch (error) {
                  props.toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to save",
                    variant: "destructive",
                  })
                }
              }}
              disabled={props.isSaving || props.isGeneratingVideos}
              className={cn(
                "w-full h-10 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] font-black text-sm",
                "bg-[color:var(--nb-btn-bg)] text-[color:var(--nb-btn-fg)]",
                "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-center">
                <Save className="w-5 h-5 mr-2" />
                SAVE WITHOUT VIDEOS
              </div>
            </Button>
          )}

          {/* Primary CTA */}
          <Button
            onClick={props.saveAndContinue}
            disabled={props.isSaving || props.isGeneratingVideos || props.totalChaptersCount === 0}
            className={cn(
              "w-full h-12 border-6 shadow-[8px_8px_0_rgba(0,0,0,1)] font-black text-lg transition-all",
              props.allChaptersCompleted
                ? "bg-[color:var(--nb-success)] text-[color:var(--nb-btn-fg)] hover:bg-[color:var(--nb-success-hover)]"
                : "bg-[color:var(--nb-primary)] text-[color:var(--nb-btn-fg)] hover:bg-[color:var(--nb-primary-hover)]",
              "hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-center">
              {props.isSaving || props.isGeneratingVideos ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {props.isSaving ? "SAVING..." : "GENERATING..."}
                </>
              ) : props.allChaptersCompleted ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  VIEW COURSE
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 mr-2" />
                  SAVE & GENERATE
                </>
              )}
              <ChevronRight className="w-5 h-5 ml-2" />
            </div>
          </Button>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between gap-2 md:gap-4">
          {/* Left: Back */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              asChild
              className={cn(
                "h-10 px-4 md:px-6 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] font-black text-sm",
                "bg-[color:var(--nb-btn-bg)] text-[color:var(--nb-btn-fg)]",
                "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all duration-150"
              )}
            >
              <Link href="/dashboard/explore" className="flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                BACK TO EXPLORE
              </Link>
            </Button>
          </div>

          {/* Middle: action group */}
          <div className="flex items-center gap-2 md:gap-4">
            {!props.allChaptersCompleted && !props.isGeneratingVideos && props.totalChaptersCount > 0 && (
              <Button
                onClick={() => props.handleGenerateAll(false)}
                disabled={props.isSaving}
                className={cn(
                  "h-10 px-4 md:px-6 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] font-black text-sm",
                  "bg-[color:var(--nb-accent)] text-[color:var(--nb-accent-fg)]",
                  "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  GENERATE ALL VIDEOS
                </div>
              </Button>
            )}

            {props.totalChaptersCount > 0 && (
              <Button
                onClick={async () => {
                  try {
                    const updateData = props.courseEditor.prepareUpdateData()
                    const saveResponse = await api.post(`/api/course/update-chapters`, updateData)
                    const saveSuccess = saveResponse?.data?.success

                    if (!saveSuccess) {
                      throw new Error(saveResponse?.data?.error || "Failed to save")
                    }

                    props.toast({
                      title: "Saved",
                      description: "Course saved. You can generate videos later.",
                    })
                    props.router.push(`/dashboard/course/${props.course.slug}`)
                  } catch (error) {
                    props.toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to save",
                      variant: "destructive",
                    })
                  }
                }}
                disabled={props.isSaving || props.isGeneratingVideos}
                className={cn(
                  "h-10 px-4 md:px-6 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] font-black text-sm",
                  "bg-[color:var(--nb-btn-bg)] text-[color:var(--nb-btn-fg)]",
                  "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  SAVE WITHOUT VIDEOS
                </div>
              </Button>
            )}
          </div>

          {/* Right: Primary CTA */}
          <div className="flex-shrink-0">
            <Button
              onClick={props.saveAndContinue}
              disabled={props.isSaving || props.isGeneratingVideos || props.totalChaptersCount === 0}
              className={cn(
                "h-10 px-6 md:px-8 border-6 shadow-[10px_10px_0_rgba(0,0,0,1)] font-black text-base transition-all",
                props.allChaptersCompleted
                  ? "bg-[color:var(--nb-success)] text-[color:var(--nb-btn-fg)] hover:bg-[color:var(--nb-success-hover)]"
                  : "bg-[color:var(--nb-primary)] text-[color:var(--nb-btn-fg)] hover:bg-[color:var(--nb-primary-hover)]",
                "hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                {props.isSaving || props.isGeneratingVideos ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {props.isSaving ? "SAVING..." : "GENERATING..."}
                  </>
                ) : props.allChaptersCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    VIEW COURSE
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    SAVE & GENERATE
                  </>
                )}
                <ChevronRight className="w-5 h-5 ml-2" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChapterFooter
