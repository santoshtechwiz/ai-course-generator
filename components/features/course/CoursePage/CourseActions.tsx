"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Heart, Share2, Star, Trash2, Loader2, ChevronRight, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCourseActions } from "@/hooks/useCourseActions"
import { useScrollDirection } from "@/hooks/use-scroll-direction"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CourseActionsProps {
  slug: string
}

export default function CourseActions({ slug }: CourseActionsProps) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { visible } = useScrollDirection()

  const handleShare = async (type: "copy" | "twitter" | "facebook" | "linkedin") => {
    const url = `${window.location.origin}/course/${slug}`

    switch (type) {
      case "copy":
        await navigator.clipboard.writeText(url)
        break
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank")
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
        break
    }
  }

  // Close the panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isOpen && !target.closest("[data-course-actions]")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        {visible && (
          <motion.div
            data-course-actions
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex"
            initial={{ x: "-100%" }}
            animate={{ x: "0" }}
            exit={{ x: "-100%" }}
            style={{ margin: 0, padding: 0 }}
          >
            {/* Main panel with actions */}
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  className="bg-white dark:bg-gray-800 shadow-lg rounded-r-lg overflow-hidden"
                  initial={{ opacity: 0, x: "-100%" }}
                  animate={{ opacity: 1, x: "0" }}
                  exit={{ opacity: 0, x: "-100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="flex flex-col p-2 gap-2">
                    {/* Public/Private Toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => handleAction("privacy")}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg",
                            "bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-150",
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading === "privacy"}
                        >
                          {loading === "privacy" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : status.isPublic ? (
                            <Eye className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{status.isPublic ? "Make Private" : "Make Public"}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Favorite Toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => handleAction("favorite")}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg",
                            "bg-pink-500 hover:bg-pink-600 text-white transition-colors duration-150",
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading === "favorite"}
                        >
                          {loading === "favorite" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Heart className={cn("h-5 w-5", status.isFavorite && "fill-current")} />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{status.isFavorite ? "Unfavorite" : "Favorite"}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Share Button */}
                    <Tooltip>
                      <DropdownMenu>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <motion.button
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-150"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Share2 className="h-5 w-5" />
                            </motion.button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => handleShare("copy")}>Copy link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("twitter")}>Share on Twitter</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("facebook")}>Share on Facebook</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("linkedin")}>Share on LinkedIn</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <TooltipContent side="right">
                        <p>Share</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Rate Course */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => setShowRating(!showRating)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Star className={cn("h-5 w-5", status.rating && "text-yellow-400 fill-yellow-400")} />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Rate Course</p>
                      </TooltipContent>
                    </Tooltip>

                    <AnimatePresence>
                      {showRating && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-1 items-center"
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <motion.button
                              key={value}
                              onClick={() => handleRating(value)}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1"
                            >
                              <Star
                                className={cn(
                                  "h-5 w-5 transition-colors duration-150",
                                  value <= (status.rating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 hover:text-yellow-400",
                                )}
                              />
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Delete Button */}
                    <Tooltip>
                      <AlertDialog>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-150"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="h-5 w-5" />
                            </motion.button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your course and all its content. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleAction("delete")}
                              disabled={loading === "delete"}
                              className="bg-red-500 text-white hover:bg-red-600"
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
                      <TooltipContent side="right">
                        <p>Delete Course</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle button - absolutely positioned to touch the edge */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="h-12 w-12 flex items-center justify-center bg-primary text-primary-foreground rounded-r-lg shadow-lg"
              style={{
                borderRadius: "0 6px 6px 0",
                margin: 0,
                padding: 0,
                border: 0,
                outline: 0,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? (
                <motion.div initial={{ rotate: 0 }} animate={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                  <ChevronRight className="h-5 w-5" />
                </motion.div>
              ) : (
                <>
                  <Settings className="h-5 w-5" />
                  {/* Attention-grabbing pulse animation */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ borderRadius: "0 6px 6px 0" }}
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{
                      opacity: [0.5, 0.2, 0.5],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      repeatType: "loop",
                    }}
                  />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}

