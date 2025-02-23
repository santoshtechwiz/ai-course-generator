"use client"

import type React from "react"

import { useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Trash2, Eye, EyeOff, Loader2, Share2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useCourseActions } from "@/hooks/useCourseActions"
import { ShareOptions } from "./ShareOptions"

interface CourseActionsProps {
  slug: string
}

export default function CourseActions({ slug }: CourseActionsProps) {
  const { status, loading, handleAction, handleRating, fetchCourseStatus } = useCourseActions({ slug })

  useEffect(() => {
    fetchCourseStatus()
  }, [fetchCourseStatus])

  const handlePrivacyToggle = useCallback(() => handleAction("privacy"), [handleAction])
  const handleFavoriteToggle = useCallback(() => handleAction("favorite"), [handleAction])
  const handleDelete = useCallback(() => handleAction("delete"), [handleAction])

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-2 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            onClick={handlePrivacyToggle}
            loading={loading === "privacy"}
            icon={status.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            text={status.isPublic ? "Private" : "Public"}
            tooltip={status.isPublic ? "Make course private" : "Make course public"}
            className={cn(
              status.isPublic
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"
                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900",
            )}
          />

          <ActionButton
            onClick={handleFavoriteToggle}
            loading={loading === "favorite"}
            icon={<Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />}
            text={status.isFavorite ? "Unfavorite" : "Favorite"}
            tooltip={status.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              status.isFavorite
                ? "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/50 dark:text-pink-300 dark:hover:bg-pink-900"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          />

          <ShareOptions slug={slug}>
           
          </ShareOptions>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ActionButton
                icon={<Trash2 className="h-4 w-4" />}
                text="Delete"
                tooltip="Delete this course"
                className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your course and all its content. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={loading === "delete"}
                  className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-800"
                >
                  {loading === "delete" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center">
          <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline"></span>
          {[1, 2, 3, 4, 5].map((value) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRating(value)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      value <= (status.rating || 0)
                        ? "fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500"
                        : "text-muted-foreground hover:text-muted-foreground/80",
                    )}
                  />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Rate {value} star{value !== 1 ? "s" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {loading === "rating" && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
    </TooltipProvider>
  )
}

interface ActionButtonProps {
  onClick?: () => void
  loading?: boolean
  icon: React.ReactNode
  text: string
  tooltip: string
  className?: string
}

function ActionButton({ onClick, loading, icon, text, tooltip, className }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          disabled={loading}
          className={cn("transition-all duration-200", className)}
        >
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </motion.span>
            ) : (
              <motion.span
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                {icon}
                <span className="hidden sm:inline">{text}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

