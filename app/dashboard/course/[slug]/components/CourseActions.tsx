"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye,
  EyeOff,
  Heart,
  Share2,
  Star,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Settings,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface CourseActionsProps {
  slug: string
  position?: "left" | "right"
}

export default function CourseActions({ slug, position = "left" }: CourseActionsProps) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { visible } = useScrollDirection()
  const [hasInteracted, setHasInteracted] = useState(false)

  // Set hasInteracted to true after first interaction
  useEffect(() => {
    if (isOpen && !hasInteracted) {
      setHasInteracted(true)
    }
  }, [isOpen, hasInteracted])

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

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  }

  const panelVariants = {
    hidden: {
      opacity: 0,
      x: position === "left" ? -20 : 20,
      width: 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      width: "auto",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      x: position === "left" ? -20 : 20,
      width: 0,
      transition: {
        duration: 0.2,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
      },
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
  }

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        {visible && (
          <motion.div
            data-course-actions
            className={cn(
              "fixed z-50 flex flex-col items-center",
              position === "left"
                ? "left-4 sm:left-6 top-1/2 -translate-y-1/2"
                : "right-4 sm:right-6 top-1/2 -translate-y-1/2",
            )}
            variants={{
              hidden: {
                opacity: 0,
                y: 20,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                },
              },
              exit: {
                opacity: 0,
                y: 20,
                transition: {
                  duration: 0.2,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Main panel with actions */}
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  className={cn(
                    "bg-card border shadow-lg rounded-xl overflow-hidden mb-3",
                    position === "left" ? "origin-bottom-left" : "origin-bottom-right",
                  )}
                  variants={{
                    hidden: {
                      opacity: 0,
                      x: position === "left" ? -20 : 20,
                      width: 0,
                    },
                    visible: {
                      opacity: 1,
                      x: 0,
                      width: "auto",
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        when: "beforeChildren",
                        staggerChildren: 0.05,
                      },
                    },
                    exit: {
                      opacity: 0,
                      x: position === "left" ? -20 : 20,
                      width: 0,
                      transition: {
                        duration: 0.2,
                        when: "afterChildren",
                        staggerChildren: 0.05,
                        staggerDirection: -1,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="flex flex-col p-3 gap-3">
                    {/* Public/Private Toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => handleAction("privacy")}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg",
                            "bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 shadow-md hover:shadow-lg",
                            "shadow-sm hover:shadow-md",
                          )}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                              },
                            },
                            exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
                          }}
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
                      <TooltipContent side={position === "left" ? "right" : "left"}>
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
                            "bg-pink-500 hover:bg-pink-600 text-white transition-all duration-200 shadow-md hover:shadow-lg",
                            "shadow-sm hover:shadow-md",
                          )}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                              },
                            },
                            exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
                          }}
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
                      <TooltipContent side={position === "left" ? "right" : "left"}>
                        <p>{status.isFavorite ? "Unfavorite" : "Favorite"}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Share Button */}
                    <Tooltip>
                      <DropdownMenu>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <motion.button
                              className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-lg",
                                "bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-md hover:shadow-lg",
                                "shadow-sm hover:shadow-md",
                              )}
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: {
                                  opacity: 1,
                                  y: 0,
                                  transition: {
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25,
                                  },
                                },
                                exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Share2 className="h-5 w-5" />
                            </motion.button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <DropdownMenuContent align={position === "left" ? "start" : "end"} className="w-56">
                          <DropdownMenuItem onClick={() => handleShare("copy")}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Copy link</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleShare("twitter")}>
                            <Twitter className="mr-2 h-4 w-4" />
                            <span>Share on Twitter</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("facebook")}>
                            <Facebook className="mr-2 h-4 w-4" />
                            <span>Share on Facebook</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                            <Linkedin className="mr-2 h-4 w-4" />
                            <span>Share on LinkedIn</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <TooltipContent side={position === "left" ? "right" : "left"}>
                        <p>Share</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Rate Course */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => setShowRating(!showRating)}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg",
                            "bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 shadow-md hover:shadow-lg",
                            "shadow-sm hover:shadow-md",
                          )}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                              },
                            },
                            exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Star className={cn("h-5 w-5", status.rating && "fill-current")} />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side={position === "left" ? "right" : "left"}>
                        <p>Rate Course</p>
                      </TooltipContent>
                    </Tooltip>

                    <AnimatePresence>
                      {showRating && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="flex flex-col gap-2 items-center bg-muted/50 rounded-lg p-2 shadow-sm"
                        >
                          <div className="text-xs font-medium text-muted-foreground">
                            {status.rating ? `Your rating: ${status.rating}/5` : "Rate this course"}
                          </div>
                          <div className="flex gap-1">
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
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-muted-foreground hover:text-amber-400",
                                  )}
                                />
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Delete Button */}
                    <Tooltip>
                      <AlertDialog>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-lg",
                                "bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-200 shadow-md hover:shadow-lg",
                                "shadow-sm hover:shadow-md",
                              )}
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: {
                                  opacity: 1,
                                  y: 0,
                                  transition: {
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25,
                                  },
                                },
                                exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
                              }}
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
                      <TooltipContent side={position === "left" ? "right" : "left"}>
                        <p>Delete Course</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "flex items-center justify-center rounded-full shadow-lg",
                "bg-primary text-primary-foreground",
                "h-14 w-14 transition-all duration-300",
                isOpen ? "scale-90" : "scale-100",
              )}
              whileHover={{ scale: isOpen ? 0.95 : 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {position === "left" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <Settings className="h-6 w-6" />

                    {/* Notification badge */}
                    {!hasInteracted && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white"
                        variant="destructive"
                      >
                        !
                      </Badge>
                    )}

                    {/* Attention-grabbing pulse animation */}
                    {!hasInteracted && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary"
                        initial={{ opacity: 0.3, scale: 1 }}
                        animate={{
                          opacity: [0.3, 0, 0.3],
                          scale: [1, 1.3, 1],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 1.5,
                          repeatType: "loop",
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
