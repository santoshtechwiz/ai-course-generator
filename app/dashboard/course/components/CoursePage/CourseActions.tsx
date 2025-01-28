"use client"

import type React from "react"
import { useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Loader2, ShieldAlert, Shield, Star, Trash2, Download } from "lucide-react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import useCourseActions from "@/hooks/useCourseActions"
import { cn } from "@/lib/utils"

interface ActionButtonProps {
  onClick: () => void
  isLoading: boolean
  icon: React.ElementType
  activeIcon: React.ElementType
  label: string
  activeLabel: string
  isActive: boolean
  activeClass: string
  inactiveClass: string
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  isLoading,
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  activeLabel,
  isActive,
  activeClass,
  inactiveClass,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("relative w-full transition-all duration-200 ease-in-out", isActive ? activeClass : inactiveClass)}
      onClick={onClick}
      disabled={isLoading}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={isActive ? "active" : "inactive"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            {isActive ? <ActiveIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            <span className="hidden md:inline text-sm font-medium">{isActive ? activeLabel : label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}

interface CourseActionsProps {
  slug: string
  quizData: any // Replace 'any' with your actual quiz data type
}

export default function CourseActions({ slug, quizData }: CourseActionsProps) {
  const { status, loading, handleAction } = useCourseActions({ slug })

  const handlePrivacyToggle = useCallback(() => handleAction("privacy"), [handleAction])
  const handleFavoriteToggle = useCallback(() => handleAction("favorite"), [handleAction])
  const handleDelete = useCallback(() => handleAction("delete"), [handleAction])

  return (
    <TooltipProvider>
      <motion.div
        className="flex flex-wrap items-stretch justify-end gap-2 p-4 rounded-lg bg-card shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 md:flex-none">
              <ActionButton
                onClick={handlePrivacyToggle}
                isLoading={loading === "privacy"}
                icon={ShieldAlert}
                activeIcon={Shield}
                label="Make Public"
                activeLabel="Make Private"
                isActive={status.isPublic}
                activeClass="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                inactiveClass="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{status.isPublic ? "Make course private" : "Make course public"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 md:flex-none">
              <ActionButton
                onClick={handleFavoriteToggle}
                isLoading={loading === "favorite"}
                icon={Star}
                activeIcon={Star}
                label="Add to Favorites"
                activeLabel="Remove from Favorites"
                isActive={status.isFavorite}
                activeClass="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                inactiveClass="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{status.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
          </TooltipContent>
        </Tooltip>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="flex-1 md:flex-none">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
              >
                <Trash2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Delete</span>
              </Button>
            </div>
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
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                {loading === "delete" ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </TooltipProvider>
  )
}

