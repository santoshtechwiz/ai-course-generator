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
      <div className="w-full bg-card rounded-lg border border-border shadow-sm animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={handlePrivacyToggle}
              loading={loading === "privacy"}
              icon={status.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              text={status.isPublic ? "Private" : "Public"}
              tooltip={status.isPublic ? "Make course private" : "Make course public"}
              variant={status.isPublic ? "success" : "warning"}
            />

            <ActionButton
              onClick={handleFavoriteToggle}
              loading={loading === "favorite"}
              icon={<Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />}
              text={status.isFavorite ? "Unfavorite" : "Favorite"}
              tooltip={status.isFavorite ? "Remove from favorites" : "Add to favorites"}
              variant={status.isFavorite ? "favorite" : "default"}
            />

            <ShareOptions slug={slug}>
             
            </ShareOptions>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <ActionButton
                  icon={<Trash2 className="h-4 w-4" />}
                  text="Delete"
                  tooltip="Delete this course"
                  variant="danger"
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

          {/* Rating Stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRating(value)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        value <= (status.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
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
  variant?: "default" | "success" | "warning" | "danger" | "info" | "favorite" | "share"
  className?: string
}

function ActionButton({ onClick, loading, icon, text, tooltip, variant = "default", className }: ActionButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-500 hover:bg-emerald-600 text-white"
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white"
      case "info":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      case "favorite":
        return "bg-pink-500 hover:bg-pink-600 text-white"
      case "share":
        return "bg-indigo-500 hover:bg-indigo-600 text-white"
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          disabled={loading}
          className={cn(
            "rounded-full font-medium transition-all duration-300 shadow-sm",
            getVariantStyles(),
            className,
          )}
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
                className="flex items-center gap-2"
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

