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
  Settings,
  Sparkles,
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface CourseActionsProps {
  slug: string
}

export default function CourseActions({ slug }: CourseActionsProps) {
  const { status, loading, handleAction, handleRating } = useCourseActions({ slug })
  const [showRating, setShowRating] = useState(false)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

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

  const actionButtons = [
    {
      id: "privacy",
      label: status.isPublic ? "Public" : "Private",
      icon: status.isPublic ? Eye : EyeOff,
      loading: loading === "privacy",
      onClick: () => handleAction("privacy"),
      color: status.isPublic
        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        : "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
      description: status.isPublic ? "Make course private" : "Make course public",
      badge: status.isPublic ? "Live" : "Draft",
      badgeColor: status.isPublic ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700",
    },
    {
      id: "favorite",
      label: "Favorite",
      icon: Heart,
      loading: loading === "favorite",
      onClick: () => handleAction("favorite"),
      color: status.isFavorite
        ? "bg-pink-500 border-pink-500 text-white hover:bg-pink-600"
        : "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100",
      description: status.isFavorite ? "Remove from favorites" : "Add to favorites",
      badge: status.isFavorite ? "Loved" : undefined,
      badgeColor: "bg-pink-100 text-pink-700",
    },
    {
      id: "share",
      label: "Share",
      icon: Share2,
      loading: false,
      onClick: null,
      color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
      description: "Share this course with others",
      badge: "Popular",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      id: "rate",
      label: "Rate",
      icon: Star,
      loading: false,
      onClick: () => setShowRating(!showRating),
      color: status.rating
        ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
      description: "Rate this course",
      badge: status.rating ? `${status.rating}★` : undefined,
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      loading: loading === "delete",
      onClick: () => handleAction("delete"),
      color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
      description: "Permanently delete this course",
      badge: "Danger",
      badgeColor: "bg-red-100 text-red-700",
      destructive: true,
    },
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full mb-4"
      >
        <Card className="border shadow-sm bg-white dark:bg-gray-950">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-emerald-500 rounded-lg shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Settings className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Course Actions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your course settings</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Enhanced
                </Badge>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {actionButtons.map(
                  (
                    { id, label, icon: Icon, loading, onClick, color, description, badge, badgeColor, destructive },
                    index,
                  ) => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredAction(id)}
                      onHoverEnd={() => setHoveredAction(null)}
                      className="relative"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {id === "share" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={cn(
                                    "relative w-full h-12 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group",
                                    color,
                                  )}
                                >
                                  {badge && (
                                    <span
                                      className={cn(
                                        "absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] rounded-md font-semibold",
                                        badgeColor,
                                      )}
                                    >
                                      {badge}
                                    </span>
                                  )}
                                  <Icon className="h-4 w-4" />
                                  <span className="hidden sm:inline">{label}</span>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="w-48">
                                <DropdownMenuItem onClick={() => handleShare("copy")}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleShare("twitter")}>
                                  <Twitter className="h-4 w-4 mr-2" />
                                  Twitter
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare("facebook")}>
                                  <Facebook className="h-4 w-4 mr-2" />
                                  Facebook
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                                  <Linkedin className="h-4 w-4 mr-2" />
                                  LinkedIn
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : destructive ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  className={cn(
                                    "relative w-full h-12 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group",
                                    color,
                                  )}
                                >
                                  {badge && (
                                    <span
                                      className={cn(
                                        "absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] rounded-md font-semibold",
                                        badgeColor,
                                      )}
                                    >
                                      {badge}
                                    </span>
                                  )}
                                  {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Icon className="h-4 w-4" />
                                  )}
                                  <span className="hidden sm:inline">{label}</span>
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    Delete Course?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete your course and all its content. This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={onClick}
                                    disabled={loading}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {loading ? (
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
                          ) : (
                            <button
                              onClick={onClick}
                              disabled={loading}
                              className={cn(
                                "relative w-full h-12 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed",
                                color,
                              )}
                            >
                              {badge && (
                                <span
                                  className={cn(
                                    "absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] rounded-md font-semibold",
                                    badgeColor,
                                  )}
                                >
                                  {badge}
                                </span>
                              )}
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Icon
                                  className={cn("h-4 w-4", id === "favorite" && status.isFavorite && "fill-current")}
                                />
                              )}
                              <span className="hidden sm:inline">{label}</span>
                            </button>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="text-center">
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  ),
                )}
              </AnimatePresence>
            </div>

            {/* Rating Stars */}
            <AnimatePresence>
              {showRating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <Separator className="mb-4" />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Rate this course:</span>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <motion.button
                        key={value}
                        onClick={() => handleRating(value)}
                        className="p-1 rounded-full hover:bg-muted transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
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
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-2 text-sm font-medium text-amber-600"
                      >
                        {status.rating}/5
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
