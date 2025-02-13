"use client"

import { useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
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
      <div className="max-w-[1200px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrivacyToggle}
                  disabled={loading === "privacy"}
                  className={cn(
                    "w-full transition-all duration-200",
                    status.isPublic
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {loading === "privacy" ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
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
                        {status.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span className="hidden sm:inline">{status.isPublic ? "Make Private" : "Make Public"}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status.isPublic ? "Make course private" : "Make course public"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFavoriteToggle}
                  disabled={loading === "favorite"}
                  className={cn(
                    "w-full transition-all duration-200",
                    status.isFavorite
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {loading === "favorite" ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
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
                        <Star className={cn("h-4 w-4", status.isFavorite && "fill-current")} />
                        <span className="hidden sm:inline">
                          {status.isFavorite ? "Remove Favorite" : "Add Favorite"}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete Course</span>
                  </span>
                </Button>
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

          <div className="flex items-center justify-center sm:justify-end gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <motion.button
                key={value}
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
            ))}
            {loading === "rating" && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

