"use client"

import { useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Loader2, ShieldAlert, Shield, Star, Trash2 } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"


import { cn } from "@/lib/utils"
import { useCourseActions } from "@/hooks/useCourseActions"

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
            <span className="hidden sm:inline text-sm font-medium">{isActive ? activeLabel : label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}

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
      <Card>
        <CardContent className="p-4">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
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
                <div>
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
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Delete</span>
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

            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Label htmlFor="rating" className="text-sm font-medium">
                Rate Course
              </Label>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      value <= (status.rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600",
                    )}
                    onClick={() => handleRating(value)}
                  />
                ))}
                {loading === "rating" && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                {!loading && status?.rating !== null && <span className="ml-2 text-sm">{status?.rating?.toFixed(1)}</span>}
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

