"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  Heart,
  Share2,
  Star,
  Trash2,
  Loader2,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Check,
  ExternalLink,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

interface CourseActionsProps {
  slug: string
  title?: string
  isOwner?: boolean
  className?: string
  variant?: "default" | "compact"
}

export default function CourseActions({
  slug,
  title = "Course Actions",
  isOwner = true,
  className = "",
  variant = "default",
}: CourseActionsProps) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleShare = async (type: "copy" | "twitter" | "facebook" | "linkedin") => {
    const url = `${window.location.origin}/course/${slug}`
    const courseTitle = title || "Check out this course"

    try {
      switch (type) {
        case "copy":
          await navigator.clipboard.writeText(url)
          setCopiedLink(true)
          toast({
            title: "Link copied! 📋",
            description: "Course link has been copied to your clipboard.",
          })
          setTimeout(() => setCopiedLink(false), 2000)
          break
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(courseTitle)}&url=${encodeURIComponent(url)}`,
            "_blank",
            "width=550,height=420",
          )
          break
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            "_blank",
            "width=580,height=296",
          )
          break
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            "_blank",
            "width=520,height=570",
          )
          break
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share the course. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isCompact = variant === "compact"

  const PrivacyButton = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={isCompact ? "sm" : "default"}
          onClick={() => handleAction("privacy")}
          disabled={loading === "privacy"}
          className={cn(
            "relative transition-all duration-200",
            status.isPublic
              ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20"
              : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950/20",
          )}
        >
          {loading === "privacy" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status.isPublic ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          {!isCompact && <span className="ml-2 hidden sm:inline">{status.isPublic ? "Public" : "Private"}</span>}
          {status.isPublic && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              Live
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{status.isPublic ? "Make course private" : "Make course public"}</p>
      </TooltipContent>
    </Tooltip>
  )

  const FavoriteButton = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={isCompact ? "sm" : "default"}
          onClick={() => handleAction("favorite")}
          disabled={loading === "favorite"}
          className={cn(
            "relative transition-all duration-200",
            status.isFavorite
              ? "text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-950/20"
              : "text-gray-600 hover:text-pink-600 hover:bg-pink-50 dark:text-gray-400 dark:hover:text-pink-400 dark:hover:bg-pink-950/20",
          )}
        >
          {loading === "favorite" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4 transition-all", status.isFavorite && "fill-current")} />
          )}
          {!isCompact && <span className="ml-2 hidden sm:inline">Favorite</span>}
          {status.isFavorite && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
            >
              ♥
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{status.isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
      </TooltipContent>
    </Tooltip>
  )

  const ShareButton = () => (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={isCompact ? "sm" : "default"}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
              {!isCompact && <span className="ml-2 hidden sm:inline">Share</span>}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share this course</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="center" className="w-48">
        <DropdownMenuItem onClick={() => handleShare("copy")} className="cursor-pointer">
          {copiedLink ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
          {copiedLink ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleShare("twitter")} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2" />
          Share on Twitter
          <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
          <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("linkedin")} className="cursor-pointer">
          <Linkedin className="h-4 w-4 mr-2" />
          Share on LinkedIn
          <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const RatingButton = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={isCompact ? "sm" : "default"}
          onClick={() => setShowRating(!showRating)}
          className={cn(
            "relative transition-all duration-200",
            status.rating
              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
              : "text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:bg-amber-950/20",
          )}
        >
          <Star className={cn("h-4 w-4 transition-all", status.rating && "fill-current")} />
          {!isCompact && <span className="ml-2 hidden sm:inline">Rate</span>}
          {status.rating && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            >
              {status.rating}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{status.rating ? `Your rating: ${status.rating}/5` : "Rate this course"}</p>
      </TooltipContent>
    </Tooltip>
  )

  const DeleteButton = () => (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size={isCompact ? "sm" : "default"}
              disabled={loading === "delete"}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all duration-200"
            >
              {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {!isCompact && <span className="ml-2 hidden sm:inline">Delete</span>}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete this course</p>
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            Delete Course?
          </AlertDialogTitle>
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
              "Delete Course"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex items-center justify-between w-full p-3 bg-white dark:bg-gray-950 border rounded-lg shadow-sm",
          className,
        )}
      >
        {/* Left side - Course info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {status.isPublic && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Public
                  </span>
                )}
                {status.isFavorite && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-current text-pink-500" />
                    Favorited
                  </span>
                )}
                {status.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-amber-500" />
                    {status.rating}/5
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <PrivacyButton />
          <FavoriteButton />
          <ShareButton />
          <RatingButton />
          {isOwner && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <DeleteButton />
            </>
          )}
        </div>
      </motion.div>

      {/* Rating Stars - Expandable section */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 p-3 bg-white dark:bg-gray-950 border rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Rate this course:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    onClick={() => handleRating(value)}
                    className="p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        value <= (status.rating || 0)
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground hover:text-amber-400",
                      )}
                    />
                  </motion.button>
                ))}
                {status.rating && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-amber-600">{status.rating}/5</span>
                    <Badge variant="secondary" className="text-xs">
                      Your Rating
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
