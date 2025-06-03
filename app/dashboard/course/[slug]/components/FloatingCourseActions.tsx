"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
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
import { cn } from "@/lib/tailwindUtils"
import { useCourseActions } from "@/hooks/useCourseActions"
import { useScrollDirection } from "@/hooks/useScrollDirection"

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks"
import { ErrorBoundary } from "react-error-boundary"

interface FloatingCourseActionsProps {
  slug: string
  position?: "left" | "right"
  badge?: number | string
  tooltip?: string
}

function CourseActionsContent({ slug, position = "left" }: { slug: string; position?: "left" | "right" }) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")
  const actionButtonControls = useAnimation()

  // Improved animation effect when actions succeed
  const animateActionSuccess = async () => {
    await actionButtonControls.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.5, ease: "easeInOut" },
    })
  }

  // Enhanced share functionality
  const handleShare = async (type: "copy" | "twitter" | "facebook" | "linkedin") => {
    const url = `${window.location.origin}/course/${slug}`
    const title = "Check out this course I found!"

    switch (type) {
      case "copy":
        try {
          await navigator.clipboard.writeText(url)
          // Show success feedback
          toast({
            title: "Link copied!",
            description: "Course link copied to clipboard",
            duration: 2000,
          })
        } catch (err) {
          console.error("Failed to copy link:", err)
        }
        break
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          "_blank",
        )
        break
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
          "_blank",
        )
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
        break
    }
  }

  // Improved animation variants with staggered effect
  const itemVariants = {
    hidden: (i: number) => ({
      opacity: 0,
      y: 20,
      transition: {
        delay: 0.05 * i,
      },
    }),
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
        delay: 0.05 * i,
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2,
        delay: 0.03 * i,
      },
    }),
    hover: {
      scale: 1.1,
      boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.9,
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.1 },
    },
  }

  return (
    <div className="flex flex-col p-3 gap-4">
      {/* Public/Private Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => {
              handleAction("privacy")
              animateActionSuccess()
            }}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl",
              "bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white",
              "transition-all duration-300 shadow-md hover:shadow-lg",
            )}
            variants={itemVariants}
            initial="hidden"
            animate={["visible", loading === "privacy" ? "loading" : ""]}
            whileHover="hover"
            whileTap="tap"
            custom={0}
            disabled={loading === "privacy"}
            animate={actionButtonControls}
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
        <TooltipContent side={position === "left" ? "right" : "left"} sideOffset={8}>
          <p className="font-medium">{status.isPublic ? "Make Private" : "Make Public"}</p>
          <p className="text-xs text-muted-foreground">
            {status.isPublic ? "Only you can see this course" : "Anyone can find this course"}
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Favorite Toggle - with enhanced animations */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => {
              handleAction("favorite")
              if (!status.isFavorite) {
                // Add heart burst animation when favoriting
                actionButtonControls.start({
                  scale: [1, 1.3, 1],
                  transition: { duration: 0.5, ease: "easeInOut" },
                })
              }
            }}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl",
              "bg-gradient-to-br from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white",
              "transition-all duration-300 shadow-md hover:shadow-lg",
            )}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            custom={1}
            disabled={loading === "favorite"}
          >
            {loading === "favorite" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <motion.div
                animate={status.isFavorite ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn("h-5 w-5", status.isFavorite && "fill-current")} />
              </motion.div>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side={position === "left" ? "right" : "left"} sideOffset={8}>
          <p className="font-medium">{status.isFavorite ? "Remove from Favorites" : "Add to Favorites"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Share Button - with improved dropdown */}
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <motion.button
                className={cn(
                  "w-11 h-11 flex items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white",
                  "transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden",
                )}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                custom={2}
              >
                <Share2 className="h-5 w-5" />
                {/* Add ripple effect */}
                <motion.span
                  className="absolute w-full h-full rounded-xl bg-white/30"
                  initial={{ scale: 0, opacity: 0.5 }}
                  whileTap={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align={position === "left" ? "start" : "end"} className="w-56 p-2">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ staggerChildren: 0.05, delayChildren: 0.01 }}
              >
                <DropdownMenuItem
                  onClick={() => handleShare("copy")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer"
                  asChild
                >
                  <motion.div
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy link</span>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={() => handleShare("twitter")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer"
                  asChild
                >
                  <motion.div whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.98 }}>
                    <Twitter className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Share on Twitter</span>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleShare("facebook")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer"
                  asChild
                >
                  <motion.div whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.98 }}>
                    <Facebook className="mr-2 h-4 w-4 text-blue-700" />
                    <span>Share on Facebook</span>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleShare("linkedin")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer"
                  asChild
                >
                  <motion.div whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.98 }}>
                    <Linkedin className="mr-2 h-4 w-4 text-blue-900" />
                    <span>Share on LinkedIn</span>
                  </motion.div>
                </DropdownMenuItem>
              </motion.div>
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent side={position === "left" ? "right" : "left"} sideOffset={8}>
          <p className="font-medium">Share Course</p>
          <p className="text-xs text-muted-foreground">Share with others</p>
        </TooltipContent>
      </Tooltip>

      {/* Rate Course - with enhanced star rating UI */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => setShowRating(!showRating)}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl",
              "bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white",
              "transition-all duration-300 shadow-md hover:shadow-lg",
              showRating && "ring-2 ring-amber-300 ring-offset-2",
            )}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            custom={3}
          >
            <Star className={cn("h-5 w-5", status.rating && "fill-current")} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side={position === "left" ? "right" : "left"} sideOffset={8}>
          <p className="font-medium">Rate Course</p>
          {status.rating ? (
            <p className="text-xs text-amber-500">Your rating: {status.rating}/5</p>
          ) : (
            <p className="text-xs text-muted-foreground">Leave your feedback</p>
          )}
        </TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-2 items-center bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-3 shadow-inner"
          >
            <div className="text-xs font-medium text-amber-800 dark:text-amber-300">
              {status.rating ? `Your rating: ${status.rating}/5` : "Rate this course"}
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.button
                  key={value}
                  onClick={() => {
                    handleRating(value)
                    // Add star burst animation
                    actionButtonControls.start({
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.3 },
                    })
                  }}
                  whileHover={{ scale: 1.3, rotate: value * 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 relative"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * value }}
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      value <= (status.rating || 0)
                        ? "text-amber-400 fill-amber-400 drop-shadow-md"
                        : "text-muted-foreground hover:text-amber-400",
                    )}
                  />
                  {/* Add glow effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-amber-200 dark:bg-amber-700 rounded-full filter blur-md"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.5 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              ))}
            </div>
            <motion.p
              className="text-xs text-center text-amber-700 dark:text-amber-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Tap to rate • {status.rating ? "Tap again to change" : "Your feedback matters"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Button - with enhanced alert dialog */}
      <Tooltip>
        <AlertDialog>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <motion.button
                className={cn(
                  "w-11 h-11 flex items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-destructive-foreground",
                  "transition-all duration-300 shadow-md hover:shadow-lg",
                )}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                custom={4}
              >
                <Trash2 className="h-5 w-5" />
              </motion.button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          {/* Enhanced alert dialog */}
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AlertDialogTitle className="text-xl font-bold">Delete Course?</AlertDialogTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AlertDialogDescription className="text-base">
                  This will permanently delete your course and all its content. This action cannot be undone.
                </AlertDialogDescription>
              </motion.div>
            </AlertDialogHeader>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AlertDialogFooter className="gap-2 sm:justify-between">
                <AlertDialogCancel className="mt-0 sm:mt-0">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction("delete")}
                  disabled={loading === "delete"}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading === "delete" ? (
                    <motion.span
                      className="flex items-center gap-2"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </motion.span>
                  ) : (
                    <motion.span
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Permanently
                    </motion.span>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </motion.div>
          </AlertDialogContent>
        </AlertDialog>
        <TooltipContent side={position === "left" ? "right" : "left"} sideOffset={8}>
          <p className="font-medium">Delete Course</p>
          <p className="text-xs text-muted-foreground">Remove this course</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 bg-destructive/10 rounded-lg">
      <h3 className="text-sm font-medium text-destructive mb-2">Something went wrong</h3>
      <p className="text-xs text-muted-foreground mb-4">{error.message}</p>
      <button onClick={resetErrorBoundary} className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md">
        Try again
      </button>
    </div>
  )
}

const FloatingCourseActions: React.FC<FloatingCourseActionsProps> = ({
  slug,
  position = "left",
  badge,
  tooltip = "Course Actions",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const { visible, direction } = useScrollDirection()

  const toggleOverlay = () => {
    setIsOpen(!isOpen)
    if (!hasInteracted) setHasInteracted(true)

    // Add haptic feedback if supported
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50)
    }
  }

  // Handle keyboard navigation and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    // Close when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        panelRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Add animation when scrolling
  useEffect(() => {
    // Add subtle animation when scrolling down/up
    if (visible) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      })
    } else {
      controls.start({
        opacity: 0,
        y: direction === "down" ? 20 : -20,
        transition: { duration: 0.3 },
      })
    }
  }, [visible, direction, controls])

  // Enhanced animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: position === "left" ? -20 : 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: position === "left" ? -20 : 20,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  }

  // Enhanced panel animation with improved timing
  const panelVariants = {
    hidden: {
      opacity: 0,
      x: position === "left" ? -30 : 30,
      scale: 0.9,
      transformOrigin: position === "left" ? "left center" : "right center",
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        when: "beforeChildren",
        staggerChildren: 0.07,
      },
    },
    exit: {
      opacity: 0,
      x: position === "left" ? -20 : 20,
      scale: 0.95,
      transition: {
        duration: 0.25,
        ease: "easeInOut",
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  }

  // Position classes based on position prop and screen size
  const positionClasses = cn(
    "fixed z-[100]",
    position === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6",
    isMobile ? "bottom-20" : "top-1/2 sm:-translate-y-1/2",
  )

  // Enhanced pulse animation with gradient
  const pulseAnimation = !hasInteracted && {
    animate: {
      boxShadow: [
        "0 0 0 0 rgba(var(--primary), 0.7)",
        "0 0 0 10px rgba(var(--primary), 0)",
      ],
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
      },
    },
  }

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        {visible && (
          <motion.div
            data-course-actions
            className={positionClasses}
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            exit="exit"
          >
            {/* Main panel with actions - improved animations */}
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  ref={panelRef}
                  id="course-actions-panel"
                  className={cn(
                    "bg-card/80 backdrop-blur-md border border-muted shadow-lg rounded-2xl overflow-hidden mb-4",
                    position === "left" ? "origin-bottom-left" : "origin-bottom-right",
                  )}
                  variants={panelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Course actions panel"
                >
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <CourseActionsContent slug={slug} position={position} />
                  </ErrorBoundary>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced toggle button with better animations */}
            <motion.button
              ref={buttonRef}
              onClick={toggleOverlay}
              className={cn(
                "flex items-center justify-center rounded-full",
                "bg-gradient-to-br from-primary/90 to-primary text-primary-foreground",
                "h-14 w-14 transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "shadow-lg shadow-primary/30",
                isOpen ? "scale-90" : "scale-100",
              )}
              whileHover={{ scale: isOpen ? 0.95 : 1.05, rotate: isOpen ? 0 : 15 }}
              whileTap={{ scale: 0.9 }}
              aria-expanded={isOpen}
              aria-controls="course-actions-panel"
              aria-label={tooltip}
              {...pulseAnimation}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {position === "left" ? (
                      <ChevronLeft className="h-6 w-6" />
                    ) : (
                      <ChevronRight className="h-6 w-6" />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative"
                  >
                    <Settings className="h-6 w-6" />

                    {/* Enhanced notification badge */}
                    {(badge || !hasInteracted) && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        <Badge
                          className="h-5 min-w-5 p-0 flex items-center justify-center bg-red-500 text-white ring-2 ring-background"
                          variant="destructive"
                        >
                          {badge || "!"}
                        </Badge>
                      </motion.div>
                    )}

                    {/* Improved attention-grabbing pulse animation */}
                    {!hasInteracted && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/50"
                        initial={{ opacity: 0.3, scale: 1 }}
                        animate={{
                          opacity: [0.3, 0, 0.3],
                          scale: [1, 1.4, 1],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 2,
                          ease: "easeInOut",
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

export default FloatingCourseActions
