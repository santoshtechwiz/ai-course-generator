"use client"

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
  Settings,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  X,
} from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { useCourseActions } from "@/hooks/useCourseActions"

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
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface CourseActionsProps {
  slug: string
}

export default function CourseActions({ slug }: CourseActionsProps) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

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
    
    setShowShareOptions(false)
  }

  // Animation variants
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
  }

  const ratingVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: { opacity: 0, height: 0 },
  }

  const ActionButton = ({
    onClick,
    icon,
    label,
    isLoading,
    loadingState,
    color = "bg-primary hover:bg-primary/90",
    tooltip,
    disabled = false,
  }: {
    onClick: () => void
    icon: React.ReactNode
    label: string
    isLoading: boolean
    loadingState?: string
    color?: string
    tooltip: string
    disabled?: boolean
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          onClick={onClick}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            "text-primary-foreground transition-all duration-200 shadow hover:shadow-md",
            color,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          variants={itemVariants}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          disabled={disabled || isLoading}
        >
          {isLoading && loadingState ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            icon
          )}
          <span className="hidden sm:inline">{label}</span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full">
        {/* Mobile Actions Bar */}
        {isMobile && (
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm border rounded-xl shadow-lg p-2 z-50 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="flex items-center justify-between gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleAction("privacy")}>
                    {status.isPublic ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    <span>{status.isPublic ? "Make Private" : "Make Public"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("favorite")}>
                    <Heart className={cn("mr-2 h-4 w-4", status.isFavorite && "fill-current")} />
                    <span>{status.isFavorite ? "Unfavorite" : "Favorite"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRating(true)}>
                    <Star className={cn("mr-2 h-4 w-4", status.rating && "fill-current")} />
                    <span>Rate Course</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowShareOptions(true)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>

              <ActionButton
                onClick={() => handleAction("privacy")}
                icon={status.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                label={status.isPublic ? "Public" : "Private"}
                isLoading={loading === "privacy"}
                loadingState="privacy"
                color={status.isPublic ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}
                tooltip={status.isPublic ? "Make Private" : "Make Public"}
              />

              <ActionButton
                onClick={() => handleAction("favorite")}
                icon={<Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />}
                label={status.isFavorite ? "Favorited" : "Favorite"}
                isLoading={loading === "favorite"}
                loadingState="favorite"
                color={status.isFavorite ? "bg-pink-500 hover:bg-pink-600" : "bg-gray-500 hover:bg-gray-600"}
                tooltip={status.isFavorite ? "Unfavorite" : "Favorite"}
              />

              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowShareOptions(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Desktop Actions Bar */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap items-center gap-3 p-4 bg-background/80 backdrop-blur-sm border rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3">
              <ActionButton
                onClick={() => handleAction("privacy")}
                icon={status.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                label={status.isPublic ? "Public" : "Private"}
                isLoading={loading === "privacy"}
                loadingState="privacy"
                color={status.isPublic ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}
                tooltip={status.isPublic ? "Make Private" : "Make Public"}
              />

              <ActionButton
                onClick={() => handleAction("favorite")}
                icon={<Heart className={cn("h-4 w-4", status.isFavorite && "fill-current")} />}
                label={status.isFavorite ? "Favorited" : "Favorite"}
                isLoading={loading === "favorite"}
                loadingState="favorite"
                color={status.isFavorite ? "bg-pink-500 hover:bg-pink-600" : "bg-gray-500 hover:bg-gray-600"}
                tooltip={status.isFavorite ? "Unfavorite" : "Favorite"}
              />

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                          "bg-blue-500 hover:bg-blue-600 text-primary-foreground transition-all duration-200 shadow hover:shadow-md"
                        )}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </motion.button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Share this course</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleShare("copy")}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy link</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleShare("twitter")}>
                    <Twitter className="mr-2 h-4 w-4" />
                    <span>Twitter</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("facebook")}>
                    <Facebook className="mr-2 h-4 w-4" />
                    <span>Facebook</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                    <Linkedin className="mr-2 h-4 w-4" />
                    <span>LinkedIn</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative">
                <ActionButton
                  onClick={() => setShowRating(!showRating)}
                  icon={<Star className={cn("h-4 w-4", status.rating && "fill-current")} />}
                  label={status.rating ? `Rated (${status.rating}/5)` : "Rate"}
                  isLoading={false}
                  color="bg-amber-500 hover:bg-amber-600"
                  tooltip="Rate this course"
                />
                
                <AnimatePresence>
                  {showRating && (
                    <motion.div
                      className="absolute bottom-full left-0 mb-3 bg-background border rounded-lg p-3 shadow-lg z-10 w-52"
                      variants={ratingVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Your Rating</p>
                        <button 
                          onClick={() => setShowRating(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => {
                              handleRating(value)
                              setShowRating(false)
                            }}
                            className={cn(
                              "p-1 transition-colors",
                              value <= (status.rating || 0)
                                ? "text-amber-400"
                                : "text-muted-foreground hover:text-amber-400"
                            )}
                          >
                            <Star
                              className={cn(
                                "h-5 w-5",
                                value <= (status.rating || 0) && "fill-current"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Fixed: Properly wrap delete button with AlertDialogTrigger */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <ActionButton
                    onClick={() => {}} // Empty handler since AlertDialogTrigger handles it
                    icon={<Trash2 className="h-4 w-4" />}
                    label="Delete"
                    isLoading={loading === "delete"}
                    loadingState="delete"
                    color="bg-destructive hover:bg-destructive/90"
                    tooltip="Delete this course"
                  />
                </div>
              </AlertDialogTrigger>
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
          </motion.div>
        )}

        {/* Mobile Modals */}
        <AnimatePresence>
          {/* Mobile Rating Modal */}
          {isMobile && showRating && (
            <motion.div
              className="fixed inset-0 bg-black/70 z-[100] flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRating(false)}
            >
              <motion.div
                className="bg-background rounded-t-xl p-5 w-full"
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Rate this course</h3>
                  <button onClick={() => setShowRating(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        handleRating(value)
                        setShowRating(false)
                      }}
                      className={cn(
                        "p-2 transition-all",
                        value <= (status.rating || 0)
                          ? "text-amber-400 scale-110"
                          : "text-muted-foreground hover:text-amber-400"
                      )}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8",
                          value <= (status.rating || 0) && "fill-current"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  {status.rating ? `Your rating: ${status.rating}/5` : "Select your rating"}
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Mobile Share Modal */}
          {isMobile && showShareOptions && (
            <motion.div
              className="fixed inset-0 bg-black/70 z-[100] flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareOptions(false)}
            >
              <motion.div
                className="bg-background rounded-t-xl p-5 w-full"
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Share this course</h3>
                  <button onClick={() => setShowShareOptions(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <button
                    onClick={() => handleShare("copy")}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                      <Copy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm">Copy</span>
                  </button>
                  <button
                    onClick={() => handleShare("twitter")}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                      <Twitter className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="text-sm">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare("facebook")}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                      <Facebook className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-sm">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                      <Linkedin className="h-6 w-6 text-blue-700" />
                    </div>
                    <span className="text-sm">LinkedIn</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global AlertDialog for Delete - Rendered at top level */}
        <AlertDialog>
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
      </div>
    </TooltipProvider>
  )
}